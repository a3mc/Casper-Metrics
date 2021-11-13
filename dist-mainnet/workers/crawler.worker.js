"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerWorker = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@loopback/core");
const services_1 = require("../services");
const logger_1 = require("../logger");
const repositories_1 = require("../repositories");
const datasources_1 = require("../datasources");
const async = tslib_1.__importStar(require("async"));
let CrawlerWorker = class CrawlerWorker {
    constructor(crawlerService, redisService) {
        this.crawlerService = crawlerService;
        this.redisService = redisService;
        this._parallelLimit = 100;
        this._asyncQueue = [];
        this._isCrawling = false;
        logger_1.logger.info('Hello from crawling worker %d', process.env.pm_id);
        this.redisService.sub.client.on('message', async (channel, message) => {
            if (channel === 'create' + process.env.pm_id && !this._isCrawling) {
                let blockHeight = Number(message);
                this._asyncQueue.push(async () => {
                    await this.crawlerService.createBlock(blockHeight)
                        .then(() => {
                        this.redisService.pub.client.publish('done', String(blockHeight));
                    })
                        .catch((error) => {
                        this.redisService.pub.client.publish('error', String(blockHeight));
                        logger_1.logger.error(error);
                    });
                });
            }
            if (channel === 'control' && message === 'start') {
                if (this._asyncQueue.length) {
                    this._isCrawling = true;
                    await this.crawlerService.getLastBlockHeight();
                    async.parallelLimit(this._asyncQueue, this._parallelLimit, async () => {
                        this._isCrawling = false;
                        this._asyncQueue = [];
                        logger_1.logger.info('Job done');
                        this.redisService.pub.client.publish('control', 'finished');
                    });
                }
                else {
                    this._isCrawling = false;
                    this._asyncQueue = [];
                    logger_1.logger.info('No tasks - Job done');
                    this.redisService.pub.client.publish('control', 'finished');
                }
            }
            if (channel === 'control' && message === 'stop') {
                this._isCrawling = false;
                this._asyncQueue = [];
            }
        });
        this.redisService.sub.client.subscribe('create' + process.env.pm_id);
        this.redisService.sub.client.subscribe('control');
        setTimeout(() => {
            this.redisService.pub.client.publish('register', String(process.env.pm_id));
        }, 5000);
    }
};
CrawlerWorker = tslib_1.__decorate([
    tslib_1.__param(0, core_1.service(services_1.CrawlerService)),
    tslib_1.__param(1, core_1.service(services_1.RedisService)),
    tslib_1.__metadata("design:paramtypes", [services_1.CrawlerService,
        services_1.RedisService])
], CrawlerWorker);
exports.CrawlerWorker = CrawlerWorker;
const dataSource = new datasources_1.MetricsDbDataSource();
new CrawlerWorker(new services_1.CrawlerService(new repositories_1.EraRepository(dataSource), new repositories_1.BlockRepository(dataSource), new repositories_1.TransferRepository(dataSource), new repositories_1.KnownAccountRepository(dataSource), new services_1.RedisService(), new services_1.CirculatingService(new repositories_1.EraRepository(dataSource), new repositories_1.BlockRepository(dataSource), new repositories_1.TransferRepository(dataSource), new repositories_1.ValidatorsUnlockRepository(dataSource), new repositories_1.CirculatingRepository(dataSource))), new services_1.RedisService());
//# sourceMappingURL=crawler.worker.js.map