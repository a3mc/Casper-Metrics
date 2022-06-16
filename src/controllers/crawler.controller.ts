import { lifeCycleObserver, service } from '@loopback/core';
import { repository } from '@loopback/repository';
import dotenv from 'dotenv';
import { finished } from 'stream';
import { logger } from '../logger';
import { BlockRepository, EraRepository, TransferRepository } from '../repositories';
import { CrawlerService, GeodataService, PriceService, RedisService } from '../services';

dotenv.config();

export interface BlockStakeInfo {
	amount: bigint;
	delegated: bigint;
	undelegated: bigint;
}

@lifeCycleObserver()
export class CrawlerController {
	private lastCalculated: number;
	private queuedBlocks: number;
	private processedBlocks: number;
	private errorBlocks: number;
	private lastBlockHeight: number;
	private finishedWorkers: number;
	private workers: number[] = [];
	// How many blocks to crawl in a batch
	// It may slow down in the end of the batch if there are a lot of transfers.
	private blocksBatchSize = Number( process.env.BLOCKS_BATCH_SIZE || 10000 );
	private meterInterval: NodeJS.Timeout;
	private crawlerTimer: NodeJS.Timeout;

	constructor(
		@service( CrawlerService ) private crawlerService: CrawlerService,
		@service( RedisService ) private redisService: RedisService,
		@service( GeodataService ) private geodataService: GeodataService,
		@service( PriceService ) private priceService: PriceService,
		@repository( BlockRepository ) public blocksRepository: BlockRepository,
		@repository( EraRepository ) public eraRepository: EraRepository,
		@repository( TransferRepository ) public transferRepository: TransferRepository,
	) {
		// Establish a connection with separate workers that help to crawl blocks as a separate process.
		this.redisService.sub.client.on( 'message', ( channel: string, message: string ) => {

			if ( channel === 'register' ) {
				logger.debug( 'Registered worker %s', message );
				this.workers.push( Number( message ) );
			}
			if ( channel === 'done' ) {
				this.processedBlocks++;
			}
			if ( channel === 'error' ) {
				this.errorBlocks++;
			}
			if ( channel === 'control' && message === 'finished' ) {
				this.finishedWorkers++;
				logger.debug( 'Worker finished: %d', this.finishedWorkers );

				if ( this.finishedWorkers >= this.workers.length ) {
					clearInterval( this.meterInterval );
					logger.info( 'Processed/Queued blocks: %d / %d', this.processedBlocks, this.queuedBlocks );
					// if ( this.queuedBlocks === this.processedBlocks ) {
					// 	//this.startCalculating();
					// } else {
					// 	this.scheduleCrawling();
					// }
					this.scheduleCrawling();
				}
			}
		} );
		this.redisService.sub.client.subscribe( 'control' );
		this.redisService.sub.client.subscribe( 'done' );
		this.redisService.sub.client.subscribe( 'error' );
		this.redisService.sub.client.subscribe( 'register' );
	}

	public async start(): Promise<void> {
		await this.redisService.client.setAsync( 'calculating', 0 );

		this.crawlerTimer = setTimeout( async () => {
			await this.crawl();
		}, 5000 );
	}

	private reset(): void {
		this.lastCalculated = 0;
		this.queuedBlocks = 0;
		this.processedBlocks = 0;
		this.errorBlocks = 0;
		this.lastBlockHeight = 0;
		this.finishedWorkers = 0;
	}

	private async crawl() {
		// We store a flag if crawling is in progress.
		if (
			!!Number( await this.redisService.client.getAsync( 'calculating' ) ) ||
			!this.workers.length
		) {
			await this.scheduleCrawling();
			return;
		}


		if ( ! Number( await this.redisService.client.getAsync( 'lastcalc' ) ) ) {
			logger.info( 'No last calculated block height found in Redis, checking for Eras in database' );
			const lastCompletedEra = await this.eraRepository.find( {
				where: {
					endBlock: {
						neq: null
					}
				},
				limit: 1,
				order: ['id desc']
			} );

			if ( lastCompletedEra && lastCompletedEra.length ) {
				logger.debug( 'Found last completed era, last calculated block: %d', lastCompletedEra[0].endBlock );
				await this.redisService.client.setAsync( 'lastcalc', lastCompletedEra[0].endBlock );
			} else {
				logger.debug( 'No existing Eras found. Starting from genesis' );
			}
		}


		// Geo data is a collection of know peers, where mostly active validators are interested for us.
		// It is collected by external service and fetched periodically.
		// If path to the service is not set it will use a mock that actually is just a dump of last fetch,
		// that should be valid enough for testing, displaying peers on the map, etc.
		logger.debug( 'Checking if geodata needs to be updated' );
		await this.geodataService.checkForUpdate().catch( () => {
			logger.error( 'Updating validators data failed' );
		} );

		// Prices are fetched by using external service.
		// It requires an access key (free key is enough) that can be set u in the .env file.
		logger.debug( 'Checking if prices need to be updated' );
		await this.priceService.checkForUpdate().catch( () => {
			logger.error( 'Updating historical price data failed' );
		} );;

		logger.info( 'Start crawling cycle.' );
		clearInterval( this.meterInterval );

		this.reset();

		// Launch a few connections to the know RPC nodes and see if at least a few have the same last block height.
		// Schedule a retry if not.
		this.lastBlockHeight = await this.crawlerService.getLastBlockHeight()
			.catch( ( error: Error ) => {
				logger.error( 'Can\'t get last block height.' );
				logger.error( error.message );
				this.scheduleCrawling();
				throw new Error();
			} );

		this.queuedBlocks = 0;
		this.processedBlocks = 0;
		this.lastCalculated = await this.redisService.client.getAsync( 'lastcalc' ) ?
			Number( await this.redisService.client.getAsync( 'lastcalc' ) ) :
			-1;

		logger.debug( 'Last calculated %d', this.lastCalculated );

		// Determine which blocks need to be crawled
		await this.collectBlocksToCrawl();

		if ( this.queuedBlocks ) {
			this.redisService.pub.client.publish( 'control', 'start' );
			this._setCrawlingMeter();
		} else {
			await this.scheduleCrawling();
		}
	}

	// A helper to see the crawling process, when crawling is started from an empty database or after a long pause.
	private _setCrawlingMeter(): void {
		this.meterInterval = setInterval( async () => {
			logger.debug(
				'Crawled %d of %d blocks with %d errors. Blocks: %d, Transfers: %d',
				this.processedBlocks,
				this.queuedBlocks,
				this.errorBlocks,
				( await this.blocksRepository.count() ).count,
				( await this.transferRepository.count() ).count
			);
		}, 10000 );
	}

	// Blocks are crawled asynchronously, in random order. But some data in Eras need the to be in the order.
	// So Only once all blocks (from a limited batch) are crawled, we can trigger the calculation that updates Eras.
	private startCalculating(): void {
		this.crawlerService.calcBlocksAndEras().then(
			() => {
				logger.debug( 'Blocks and eras are calculated. Scheduled re-crawling.' );
			},
		).catch(
			( error ) => {
				logger.error( 'Error calculating blocks and eras.' );
				logger.error( error );
			},
		).finally( async () => {
			await this.redisService.client.setAsync( 'calculating', 0 );
			await this.scheduleCrawling();
		} );
	}

	// Compare last calculated (that means its Era is process too) blocks and start from the next till the last known one.
	// When there's no catching up, it's usually just one block.
	private async collectBlocksToCrawl(): Promise<void> {
		let worker = 0;

		for ( let blockHeight = 0; blockHeight <= this.lastBlockHeight; blockHeight++ ) {
			/* Add unprocessed blocks to the queue */
			if (
				!await this.redisService.client.getAsync( 'h' + String( blockHeight ) ) &&
				this.queuedBlocks < this.blocksBatchSize
			) {
				this.queuedBlocks++;
				this.redisService.pub.client.publish( 'create' + this.workers[worker], String( blockHeight ) );
				worker++;
				if ( worker > this.workers.length - 1 ) {
					worker = 0;
				}
			}
		}

		logger.info( 'Scheduled %d blocks to crawl', this.queuedBlocks );
	}

	// A little delay to let workers finish their task and report that to the controller.
	// After that the new crawling loop starts.
	private async scheduleCrawling(): Promise<void> {
		clearInterval( this.meterInterval );
		clearTimeout( this.crawlerTimer );
		this.crawlerTimer = setTimeout( () => {
			this.crawl();
		}, 5000 );
	}
}
