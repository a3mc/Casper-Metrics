import { logger } from '../logger';
import { CrawlerService, RedisService } from '../services';
import { LifeCycleObserver, lifeCycleObserver, service } from '@loopback/core';
import moment from 'moment';
import { finished } from "stream";

export interface BlockStakeInfo {
    amount: bigint;
    delegated: bigint;
    undelegated: bigint;
}

//@lifeCycleObserver()
export class CrawlerController {
    private lastCalculated: number;
    private queuedBlocks: number;
    private processedBlocks: number;
    private lastBlockHeight: number;
    private finishedWorkers: number;
    private workers: number[] = [];

    constructor(
        @service( CrawlerService ) private crawlerService: CrawlerService,
        @service( RedisService ) private redisService: RedisService,
    ) {
        this.redisService.sub.client.on( 'message', ( channel: string, message: string ) => {

            if ( channel === 'register' ) {
                logger.info( 'Registered worker %s', message)
                this.workers.push( Number( message ) );
            }
            if ( channel === 'done' ) {
                this.processedBlocks++;
            }
            if ( channel === 'control' && message === 'finished' ) {
                this.finishedWorkers++;
                logger.info( 'Worker finished: %d', this.finishedWorkers );

                if ( this.finishedWorkers === this.workers.length ) {
                    logger.info( 'Processed/Queued blocks: %d / %d', this.processedBlocks, this.queuedBlocks )
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
        this.redisService.sub.client.subscribe( 'register' );
    }

    public async start(): Promise<void> {
        await this.redisService.client.setAsync( 'calculating', 0 );
        setTimeout( async () => {
            await this.crawl();
        }, 7000 );
    }

    private reset(): void {
        this.lastCalculated = 0;
        this.queuedBlocks = 0;
        this.processedBlocks = 0;
        this.lastBlockHeight = 0;
        this.finishedWorkers = 0;
    }

    private async crawl() {
        if ( !!Number( await this.redisService.client.getAsync( 'calculating' ) ) ) {
            await this.scheduleCrawling();
            return;
        }
        logger.info( 'Start crawling cycle.' );

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
        this.lastCalculated = await this.redisService.client.getAsync( 'lastcalc' )  ?
            Number( await this.redisService.client.getAsync( 'lastcalc' ) ):
            -1;

        logger.info( 'Last calculated %d', this.lastCalculated );

        await this.collectBlocksToCrawl();

        if ( this.queuedBlocks ) {
            this.redisService.pub.client.publish( 'control', 'start' );
        } else {
            await this.scheduleCrawling();
        }
    }

    private startCalculating() {
        this.crawlerService.calcBlocksAndEras().then(
            () => {
                logger.info( 'Blocks and eras are calculated. Scheduled re-crawling.' );
            }
        ).catch(
            ( error ) => {
                logger.error( 'Error calculating blocks and eras.' );
                logger.error( error );
            }
        ).finally( async () => {
            await this.redisService.client.setAsync( 'calculating', 0 );
            await this.scheduleCrawling();
        } );
    }

    private async collectBlocksToCrawl(): Promise<void> {
        let worker = 0;
        for ( let blockHeight = this.lastCalculated + 1; blockHeight <= this.lastBlockHeight; blockHeight++ ) {
            /* Add unprocessed blocks to the queue */
            if ( !await this.redisService.client.getAsync( 'b' + String( blockHeight ) ) ) {
                this.queuedBlocks++;

                this.redisService.pub.client.publish( 'create' + this.workers[worker], String( blockHeight ) );
                worker++;
                if ( worker > this.workers.length - 1 ) {
                    worker = 0;
                }
            }
        }
    }

    private async scheduleCrawling(): Promise<void> {
        this.redisService.pub.client.publish( 'control', 'stop' );
        logger.info( 'Re-crawling in 30 seconds' );
        setTimeout( () => {
            this.crawl();
        }, 30000 );
    }
}
