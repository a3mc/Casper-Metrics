import { service } from '@loopback/core';
import { CirculatingService, CrawlerService, RedisService } from '../services';
import { logger } from '../logger';
import {
    BlockRepository,
    CirculatingRepository,
    EraRepository,
    KnownAccountRepository,
    TransferRepository,
    ValidatorsUnlockRepository
} from '../repositories';
import { MetricsDbDataSource } from '../datasources';
import * as async from 'async';

export class CrawlerWorker {
    private _parallelLimit = 100;
    private _asyncQueue: any = [];
    private _isCrawling = false;

    constructor(
        @service( CrawlerService ) public crawlerService: CrawlerService,
        @service( RedisService ) public redisService: RedisService,
    ) {
        logger.info( 'Hello from crawling worker %d', process.env.pm_id );

        this.redisService.sub.client.on( 'message', async ( channel: string, message: string ) => {
            if ( channel === 'create' + process.env.pm_id && !this._isCrawling ) {
                let blockHeight = Number( message );
                this._asyncQueue.push( async () => {
                    await this.crawlerService.createBlock( blockHeight )
                        .then( () => {
                            this.redisService.pub.client.publish( 'done', String( blockHeight ) );
                        } )
                        .catch( ( error ) => {
                            this.redisService.pub.client.publish( 'error', String( blockHeight ) );
                            logger.error( error );
                        } );
                } );
            }

            if ( channel === 'control' && message === 'start' ) {
                if ( this._asyncQueue.length ) {
                    console.log( `Starting crawling ${ this._asyncQueue.length } blocks` )
                    this._isCrawling = true;
                    await this.crawlerService.getLastBlockHeight();
                    async.parallelLimit(
                        this._asyncQueue,
                        this._parallelLimit,
                        async () => {
                            this._isCrawling = false;
                            this._asyncQueue = [];
                            logger.info( 'Job done' );
                            this.redisService.pub.client.publish( 'control', 'finished' );
                        }
                    );
                } else {
                    this._isCrawling = false;
                    this._asyncQueue = [];
                    logger.info( 'No tasks - Job done' );
                    this.redisService.pub.client.publish( 'control', 'finished' );
                }
            }

            if ( channel === 'control' && message === 'stop' ) {
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

const dataSource = new MetricsDbDataSource();
new CrawlerWorker(
    new CrawlerService(
        new EraRepository( dataSource ),
        new BlockRepository( dataSource ),
        new TransferRepository( dataSource ),
        new KnownAccountRepository( dataSource ),
        new RedisService(),
        new CirculatingService(
            new EraRepository( dataSource ),
            new BlockRepository( dataSource ),
            new TransferRepository( dataSource ),
            new ValidatorsUnlockRepository( dataSource ),
            new CirculatingRepository( dataSource ),
        ),
    ),
    new RedisService()
);
