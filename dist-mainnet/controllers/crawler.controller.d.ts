import { CrawlerService, RedisService } from '../services';
export interface BlockStakeInfo {
    amount: bigint;
    delegated: bigint;
    undelegated: bigint;
}
export declare class CrawlerController {
    private crawlerService;
    private redisService;
    private lastCalculated;
    private queuedBlocks;
    private processedBlocks;
    private lastBlockHeight;
    private finishedWorkers;
    private workers;
    constructor(crawlerService: CrawlerService, redisService: RedisService);
    start(): Promise<void>;
    private reset;
    private crawl;
    private startCalculating;
    private collectBlocksToCrawl;
    private scheduleCrawling;
}
