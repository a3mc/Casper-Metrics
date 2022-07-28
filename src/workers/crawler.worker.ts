import { service } from '@loopback/core';
import * as async from 'async';
import dotenv from 'dotenv';
import { MetricsDbDataSource } from '../datasources';
import { logger } from '../logger';
import {
	BlockRepository,
	EraRepository,
	KnownAccountRepository, PeersRepository, ProcessingRepository,
	TransferRepository,
	ValidatorsUnlockRepository,
} from '../repositories';
import { CirculatingService, CrawlerService, RedisService } from '../services';

dotenv.config();

// The purpose of this worker is to help the application to crawl blocks faster.
// There's some flexibility how many workers can be launched. They rely on PM2 to manage them
// and on Redis for internal communication. Using that boosts the crawling speed when catch up is needed.
export class CrawlerWorker {
	// Depending on the network it can allow to boost io in parallel
	private _parallelLimit = Number( process.env.PARALLEL_LIMIT || 100 );
	// A queue array used for parallel tasks.
	private _asyncQueue: any = [];
	// Flag indicating if crawling is in progress.
	private _isCrawling = false;

	// This class requires a CrawlerService and a RedisService to initialise.
	constructor(
		@service( CrawlerService ) public crawlerService: CrawlerService,
		@service( RedisService ) public redisService: RedisService,
	) {
		logger.debug( 'Hello from crawling worker %d', process.env.pm_id );

		// Register the worker and set up communication with the main app.
		this.redisService.sub.client.on( 'message', async ( channel: string, message: string ) => {
			if ( channel === 'create' + process.env.pm_id && !this._isCrawling ) {
				let blockHeight = Number( message );
				// Push a new task with the given blockHeight to the queue.
				this._asyncQueue.push( async () => {
						// Store the result to allow safe failing in case of network errors.
						let result: boolean = true;
						await this.crawlerService.createBlock( blockHeight )
							.catch( () => {
								// If block wasn't parsed correctly, it will have no record in Redis db.
								// That way it will allow us to find that block and add it to the queue on the next loop cycle.
								result = false;
								// Respond to the master process that there was an error, and when parsing which Block.
								// As there can be various network side effects when parsing a big amount of blocks,
								// here the exact error doesn't make sense to us - just to record the block where it happened,
								// so we can re-crawl it again.
								this.redisService.pub.client.publish( 'error', String( blockHeight ) );
							} );

						if ( result ) {
							// Tell the master process that the block was crawled successfully.
							this.redisService.pub.client.publish( 'done', String( blockHeight ) );
						}
					},
				);
			}

			if ( channel === 'control' && message === 'start' ) {
				if ( this._asyncQueue.length ) {
					// Tasks to launch are already in the queue here.
					logger.debug( `Starting crawling ${ this._asyncQueue.length } blocks` );
					this._isCrawling = true;
					// Open connections to RPC services, so we can send requests to them and reuse the connections.
					await this.crawlerService.setCasperServices();

					// Using parallel tasks helps boosting IO a bit, and the speed as the result.
					async.parallelLimit(
						this._asyncQueue,
						this._parallelLimit,
						() => {
							logger.debug( 'Job done' );

							// Once job is done, worker reports it to the master app.
							if ( this._isCrawling ) {
								this._isCrawling = false;
								this.redisService.pub.client.publish( 'control', 'finished' );
							}
							// Clear the queue, once all tasks are done.
							this._asyncQueue = [];
						},
					);
				} else {
					this._isCrawling = false;
					this._asyncQueue = [];
					logger.debug( 'No tasks - Job done' );
					// Report to the master process that the worker finished its part,
					// even if there were no tasks to process in this case.
					this.redisService.pub.client.publish( 'control', 'finished' );
				}
			}

			// Worker can be stopped by a command and empty its queue.
			if ( channel === 'control' && message === 'stop' ) {
				// Empty the queue, drop the flag and report the end to the master process.
				if ( this._isCrawling ) {
					this.redisService.pub.client.publish( 'control', 'finished' );
				}
				this._isCrawling = false;
				this._asyncQueue = [];
			}
		} );

		// We use a process id here to distinguish between multiple worker.
		// Create a new subscription to listen for commands.
		this.redisService.sub.client.subscribe( 'create' + process.env.pm_id );
		this.redisService.sub.client.subscribe( 'control' );

		// Even though there's no delay here usually, make sure that the main app is fully up,
		// before registering to its commands. If it fails for some reason it will be rebooted by PM2.
		setTimeout( () => {
			this.redisService.pub.client.publish( 'register', String( process.env.pm_id ) );
		}, 5000 );
	}
}

// This is the main datasource - MySQL in production mode, or an in-memory db in case of running tests.
const dataSource = new MetricsDbDataSource();

// As we don't use LifeCycleObserver here, the instance's dependencies are specified manually here.
// Pass all the dependencies, including repositories that are needed for the services to operate data.
new CrawlerWorker(
	new CrawlerService(
		new EraRepository( dataSource ),
		new BlockRepository( dataSource ),
		new TransferRepository( dataSource ),
		new KnownAccountRepository( dataSource ),
		new PeersRepository( dataSource ),
		new RedisService(),
		new CirculatingService(
			new EraRepository( dataSource ),
			new BlockRepository( dataSource ),
			new TransferRepository( dataSource ),
			new ValidatorsUnlockRepository( dataSource ),
			new ProcessingRepository( dataSource ),
		),
	),
	new RedisService(), // Redis service doesn't need any dependencies to be passed.
);
