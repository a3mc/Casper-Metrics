import { lifeCycleObserver, service } from '@loopback/core';
import dotenv from 'dotenv';
import { finished } from 'stream';
import { logger } from '../logger';
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
	private lastProcessedBlocks: number;
	private errorBlocks: number;
	private lastBlockHeight: number;
	private finishedWorkers: number;
	private workers: number[] = [];
	private blocksBatchSize = 50000;
	private meterInterval: NodeJS.Timeout;
	private crawlerTimer: NodeJS.Timeout;

	constructor(
		@service( CrawlerService ) private crawlerService: CrawlerService,
		@service( RedisService ) private redisService: RedisService,
		@service( GeodataService ) private geodataService: GeodataService,
		@service( PriceService ) private priceService: PriceService,
	) {
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
					if ( this.queuedBlocks === this.processedBlocks ) {
						this.startCalculating();
					} else {
						this.scheduleCrawling();
					}
				}
			}
		} );
		this.redisService.sub.client.subscribe( 'control' );
		this.redisService.sub.client.subscribe( 'done' );
		this.redisService.sub.client.subscribe( 'error' );
		this.redisService.sub.client.subscribe( 'register' );
	}

	public async start(): Promise<void> {
		await this.crawlerService.updateTransfers();


		// await this.redisService.client.setAsync( 'calculating', 0 );
		// this.crawlerTimer = setTimeout( async () => {
		// 	await this.crawl();
		// }, 5000 );
	}

	public async stop(): Promise<void> {
		logger.debug( 'Crawler is stopping.' );
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
		if (
			!!Number( await this.redisService.client.getAsync( 'calculating' ) ) ||
			!this.workers.length
		) {
			await this.scheduleCrawling();
			return;
		}
		logger.debug( 'Checking if geodata needs to be updated' );
		await this.geodataService.checkForUpdate().catch( () => {
			logger.error( 'Updating validators data failed' );
		} );

		logger.debug( 'Checking if prices need to be updated' );
		await this.priceService.checkForUpdate().catch( () => {
			logger.error( 'Updating historical price data failed' );
		} );;

		logger.info( 'Start crawling cycle.' );
		clearInterval( this.meterInterval );

		this.reset();

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

		await this.collectBlocksToCrawl();

		if ( this.queuedBlocks ) {
			this.redisService.pub.client.publish( 'control', 'start' );
			this._setCrawlingMeter();
		} else {
			await this.scheduleCrawling();
		}
	}

	private _setCrawlingMeter(): void {
		this.meterInterval = setInterval( () => {
			logger.debug(
				'Crawled %d of %d blocks with %d errors',
				this.processedBlocks,
				this.queuedBlocks,
				this.errorBlocks,
			);
		}, 60000 );
	}

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

	private async collectBlocksToCrawl(): Promise<void> {
		let worker = 0;

		for ( let blockHeight = this.lastCalculated + 1; blockHeight <= this.lastBlockHeight; blockHeight++ ) {
			/* Add unprocessed blocks to the queue */
			if (
				!await this.redisService.client.getAsync( 'b' + String( blockHeight ) ) &&
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

	private async scheduleCrawling(): Promise<void> {
		clearInterval( this.meterInterval );
		clearTimeout( this.crawlerTimer );
		this.crawlerTimer = setTimeout( () => {
			this.crawl();
		}, 10000 );
	}
}
