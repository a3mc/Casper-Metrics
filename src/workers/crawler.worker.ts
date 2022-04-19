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
	// Some internet providers may limit the traffic, and it might not work well with the default setting.
	// In that case you can set it to 1 that will slow down the crawling but will make it more stable.
	// Values higher than 200 give too much load on RPC servers, so it's easy to hit the limit rate	.
	private _parallelLimit = 150;
	private _asyncQueue: any = [];
	private _isCrawling = false;

	constructor(
		@service( CrawlerService ) public crawlerService: CrawlerService,
		@service( RedisService ) public redisService: RedisService,
	) {
		logger.debug( 'Hello from crawling worker %d', process.env.pm_id );

		// Register the worker and set up communication with the main app.
		this.redisService.sub.client.on( 'message', async ( channel: string, message: string ) => {
			if ( channel === 'create' + process.env.pm_id && !this._isCrawling ) {
				let blockHeight = Number( message );
				this._asyncQueue.push( async () => {
						let result: boolean = true;
						await this.crawlerService.createBlock( blockHeight )
							.catch( () => {
								result = false;
								this.redisService.pub.client.publish( 'error', String( blockHeight ) );
							} );

						if ( result ) {
							this.redisService.pub.client.publish( 'done', String( blockHeight ) );
						}

					},
				);
			}

			if ( channel === 'control' && message === 'start' ) {
				if ( this._asyncQueue.length ) {
					logger.debug( `Starting crawling ${ this._asyncQueue.length } blocks` );
					this._isCrawling = true;
					await this.crawlerService.setCasperServices();

					// using parallel tasks helps boosting IO a bit, and the speed as the result.
					async.parallelLimit(
						this._asyncQueue,
						this._parallelLimit,
						() => {
							logger.debug( 'Job done' );

							// Once job is done, worker reports it to the app.
							if ( this._isCrawling ) {
								this._isCrawling = false;
								this.redisService.pub.client.publish( 'control', 'finished' );
							}
							this._asyncQueue = [];
						},
					);
				} else {
					this._isCrawling = false;
					this._asyncQueue = [];
					logger.debug( 'No tasks - Job done' );
					this.redisService.pub.client.publish( 'control', 'finished' );
				}
			}

			// Worker can be stopped by a command and empty its queue.
			if ( channel === 'control' && message === 'stop' ) {
				if ( this._isCrawling ) {
					this.redisService.pub.client.publish( 'control', 'finished' );
				}
				this._isCrawling = false;
				this._asyncQueue = [];
			}
		} );

		this.redisService.sub.client.subscribe( 'create' + process.env.pm_id );
		this.redisService.sub.client.subscribe( 'control' );

		setTimeout( () => {
			this.redisService.pub.client.publish( 'register', String( process.env.pm_id ) );
		}, 5000 );
	}
}

// As we don't use LifeCycleObserver here, the instance's dependencies are specified manually here.
const dataSource = new MetricsDbDataSource();
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
	new RedisService(),
);
