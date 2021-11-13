"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockController = void 0;
const tslib_1 = require("tslib");
const repository_1 = require("@loopback/repository");
const rest_1 = require("@loopback/rest");
const models_1 = require("../models");
const repositories_1 = require("../repositories");
const errors_1 = require("../errors/errors");
let BlockController = class BlockController {
    constructor(blocksRepository, eraRepository) {
        this.blocksRepository = blocksRepository;
        this.eraRepository = eraRepository;
    }
    async find(blockHeight) {
        let filter = {
            limit: 1,
            order: ['blockHeight DESC'],
        };
        if (blockHeight !== undefined) {
            filter.where = {
                blockHeight: blockHeight
            };
        }
        const block = await this.blocksRepository.findOne(filter);
        if (block) {
            const circulatingSupply = await this._getLastCirculatingSupply(block);
            block.circulatingSupply = Number(circulatingSupply);
        }
        else {
            throw new errors_1.NotFound();
        }
        // Remove temporarily unused properties.
        delete block.stakedDiffSinceGenesis;
        delete block.stakedDiffSinceGenesisMotes;
        delete block.stakedDiffThisBlock;
        return block;
    }
    async circulating(blockHeight) {
        let filter = {
            limit: 1,
            order: ['blockHeight DESC']
        };
        if (blockHeight !== undefined) {
            filter.where = {
                blockHeight: blockHeight
            };
        }
        const block = await this.blocksRepository.findOne(filter);
        if (!block) {
            throw new errors_1.NotFound();
        }
        return (await this._getLastCirculatingSupply(block)).toString();
    }
    async total(blockHeight) {
        let filter = {
            limit: 1,
            order: ['blockHeight DESC']
        };
        if (blockHeight !== undefined) {
            filter.where = {
                blockHeight: blockHeight
            };
        }
        const lastRecord = await this.blocksRepository.findOne(filter)
            .catch(error => {
        });
        if (!lastRecord) {
            throw new errors_1.NotFound();
        }
        return lastRecord.totalSupply.toString();
    }
    async _getLastCirculatingSupply(block) {
        let circulatingSupply = BigInt(0);
        if (block && block.eraId) {
            const blockEra = await this.eraRepository.findById(block.eraId);
            circulatingSupply = blockEra.circulatingSupply;
        }
        return circulatingSupply;
    }
};
tslib_1.__decorate([
    rest_1.get('/block'),
    rest_1.response(200, {
        description: `Last block or a block specified by blockHeight.
        `,
        content: {
            'application/json': {
                schema: rest_1.getModelSchemaRef(models_1.Block, { includeRelations: false }),
            },
        },
    }),
    tslib_1.__param(0, rest_1.param.query.number('blockHeight')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Number]),
    tslib_1.__metadata("design:returntype", Promise)
], BlockController.prototype, "find", null);
tslib_1.__decorate([
    rest_1.get('block/circulating'),
    rest_1.response(200, {
        description: `Most recent Circulation Supply of the last completed Era when called without params.
        Can be queried by "blockHeight"`,
        content: {
            'application/json': {},
        },
    }),
    tslib_1.__param(0, rest_1.param.query.number('blockHeight')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Number]),
    tslib_1.__metadata("design:returntype", Promise)
], BlockController.prototype, "circulating", null);
tslib_1.__decorate([
    rest_1.get('block/total'),
    rest_1.response(200, {
        description: `Most recent Total Supply of the last completed Era when called without params.
        Can be queried by "blockHeight"`,
        content: {
            'application/json': {},
        },
    }),
    tslib_1.__param(0, rest_1.param.query.number('blockHeight')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Number]),
    tslib_1.__metadata("design:returntype", Promise)
], BlockController.prototype, "total", null);
BlockController = tslib_1.__decorate([
    tslib_1.__param(0, repository_1.repository(repositories_1.BlockRepository)),
    tslib_1.__param(1, repository_1.repository(repositories_1.EraRepository)),
    tslib_1.__metadata("design:paramtypes", [repositories_1.BlockRepository,
        repositories_1.EraRepository])
], BlockController);
exports.BlockController = BlockController;
//# sourceMappingURL=block.controller.js.map