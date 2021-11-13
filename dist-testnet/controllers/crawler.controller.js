"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerController = void 0;
const tslib_1 = require("tslib");
const logger_1 = require("../logger");
const services_1 = require("../services");
const core_1 = require("@loopback/core");
//@lifeCycleObserver()
let CrawlerController = class CrawlerController {
    constructor(crawlerService, redisService) {
        this.crawlerService = crawlerService;
        this.redisService = redisService;
        this.workers = [];
        this.redisService.sub.client.on('message', (channel, message) => {
            if (channel === 'register') {
                logger_1.logger.info('Registered worker %s', message);
                this.workers.push(Number(message));
            }
            if (channel === 'done') {
                this.processedBlocks++;
            }
            if (channel === 'control' && message === 'finished') {
                this.finishedWorkers++;
                logger_1.logger.info('Worker finished: %d', this.finishedWorkers);
                if (this.finishedWorkers === this.workers.length) {
                    logger_1.logger.info('Processed/Queued blocks: %d / %d', this.processedBlocks, this.queuedBlocks);
                    if (this.queuedBlocks === this.processedBlocks) {
                        this.startCalculating();
                    }
                    else {
                        this.scheduleCrawling();
                    }
                }
            }
        });
        this.redisService.sub.client.subscribe('control');
        this.redisService.sub.client.subscribe('done');
        this.redisService.sub.client.subscribe('register');
    }
    async start() {
        await this.redisService.client.setAsync('calculating', 0);
        setTimeout(async () => {
            await this.crawl();
        }, 7000);
    }
    reset() {
        this.lastCalculated = 0;
        this.queuedBlocks = 0;
        this.processedBlocks = 0;
        this.lastBlockHeight = 0;
        this.finishedWorkers = 0;
    }
    async crawl() {
        if (!!Number(await this.redisService.client.getAsync('calculating'))) {
            await this.scheduleCrawling();
            return;
        }
        logger_1.logger.info('Start crawling cycle.');
        this.reset();
        this.lastBlockHeight = await this.crawlerService.getLastBlockHeight()
            .catch((error) => {
            logger_1.logger.error('Can\'t get last block height.');
            logger_1.logger.error(error.message);
            this.scheduleCrawling();
            throw new Error();
        });
        this.queuedBlocks = 0;
        this.processedBlocks = 0;
        this.lastCalculated = await this.redisService.client.getAsync('lastcalc') ?
            Number(await this.redisService.client.getAsync('lastcalc')) :
            -1;
        logger_1.logger.info('Last calculated %d', this.lastCalculated);
        await this.collectBlocksToCrawl();
        if (this.queuedBlocks) {
            this.redisService.pub.client.publish('control', 'start');
        }
        else {
            await this.scheduleCrawling();
        }
    }
    startCalculating() {
        this.crawlerService.calcBlocksAndEras().then(() => {
            logger_1.logger.info('Blocks and eras are calculated. Scheduled re-crawling.');
        }).catch((error) => {
            logger_1.logger.error('Error calculating blocks and eras.');
            logger_1.logger.error(error);
        }).finally(async () => {
            await this.redisService.client.setAsync('calculating', 0);
            await this.scheduleCrawling();
        });
    }
    async collectBlocksToCrawl() {
        let worker = 0;
        for (let blockHeight = this.lastCalculated + 1; blockHeight <= this.lastBlockHeight; blockHeight++) {
            /* Add unprocessed blocks to the queue */
            if (!await this.redisService.client.getAsync('b' + String(blockHeight))) {
                this.queuedBlocks++;
                this.redisService.pub.client.publish('create' + this.workers[worker], String(blockHeight));
                worker++;
                if (worker > this.workers.length - 1) {
                    worker = 0;
                }
            }
        }
    }
    async scheduleCrawling() {
        this.redisService.pub.client.publish('control', 'stop');
        logger_1.logger.info('Re-crawling in 30 seconds');
        setTimeout(() => {
            this.crawl();
        }, 30000);
    }
};
CrawlerController = tslib_1.__decorate([
    tslib_1.__param(0, core_1.service(services_1.CrawlerService)),
    tslib_1.__param(1, core_1.service(services_1.RedisService)),
    tslib_1.__metadata("design:paramtypes", [services_1.CrawlerService,
        services_1.RedisService])
], CrawlerController);
exports.CrawlerController = CrawlerController;
//# sourceMappingURL=crawler.controller.js.map