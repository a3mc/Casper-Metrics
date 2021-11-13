import { CrawlerService, RedisService } from '../services';
export declare class CrawlerWorker {
    crawlerService: CrawlerService;
    redisService: RedisService;
    private _parallelLimit;
    private _asyncQueue;
    private _isCrawling;
    constructor(crawlerService: CrawlerService, redisService: RedisService);
}
