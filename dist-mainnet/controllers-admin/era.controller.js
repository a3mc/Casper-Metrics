"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EraController = void 0;
const tslib_1 = require("tslib");
const repository_1 = require("@loopback/repository");
const rest_1 = require("@loopback/rest");
const models_1 = require("../models");
const repositories_1 = require("../repositories");
const errors_1 = require("../errors/errors");
let EraController = class EraController {
    constructor(eraRepository) {
        this.eraRepository = eraRepository;
    }
    async circulating(id) {
        let filter = {
            limit: 1,
            order: ['id DESC']
        };
        if (id !== undefined) {
            filter.where = {
                id: id,
            };
        }
        const lastRecord = await this.eraRepository.findOne(filter)
            .catch(error => {
        });
        if (!lastRecord) {
            throw new errors_1.NotFound();
        }
        return lastRecord.circulatingSupply.toString();
    }
    async total(id) {
        let filter = {
            limit: 1,
            order: ['id DESC']
        };
        if (id !== undefined) {
            filter.where = {
                id: id,
            };
        }
        const lastRecord = await this.eraRepository.findOne(filter)
            .catch(error => {
        });
        if (!lastRecord) {
            throw new errors_1.NotFound();
        }
        return lastRecord.totalSupply.toString();
    }
    async find(id, blockHeight, timestamp, limit, order) {
        let filter = {
            // TODO: Define a max limit.
            limit: limit ? Math.min(limit, 10000) : 1,
            order: order ? order : ['id DESC'],
            where: this._calcSupplyQueryFilter(id, blockHeight, timestamp),
        };
        return this.eraRepository.find(filter);
    }
    _calcSupplyQueryFilter(id, blockHeight, timestamp) {
        let where = {};
        if (id !== undefined) {
            where.id = id;
        }
        else if (blockHeight !== undefined) {
            where.and = [
                {
                    startBlock: {
                        lte: blockHeight
                    }
                },
                {
                    or: [
                        {
                            endBlock: null
                        },
                        {
                            endBlock: {
                                gte: blockHeight
                            }
                        }
                    ]
                }
            ];
        }
        else if (timestamp) {
            where.and = [
                {
                    start: {
                        lte: timestamp
                    }
                },
                {
                    or: [
                        {
                            end: null
                        },
                        {
                            end: {
                                gte: timestamp
                            }
                        }
                    ]
                },
            ];
        }
        return where;
    }
};
tslib_1.__decorate([
    rest_1.get('/api/era/circulating'),
    rest_1.response(200, {
        description: `Last Era "Circulation Supply" when called without params.
        Era data is updated on the Switch Block.
        Can be queried by "eraId"`,
        content: {
            'application/json': {},
        },
    }),
    tslib_1.__param(0, rest_1.param.query.number('eraId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Number]),
    tslib_1.__metadata("design:returntype", Promise)
], EraController.prototype, "circulating", null);
tslib_1.__decorate([
    rest_1.get('/api/era/total'),
    rest_1.response(200, {
        description: `Last Era "Total Supply" when called without params.
        Era data is updated on the Switch Block.
        Can be queried by either "eraId"`,
        content: {
            'application/json': {},
        },
    }),
    tslib_1.__param(0, rest_1.param.query.number('eraId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Number]),
    tslib_1.__metadata("design:returntype", Promise)
], EraController.prototype, "total", null);
tslib_1.__decorate([
    rest_1.get('/api/era'),
    rest_1.response(200, {
        description: `Last Era metrics when called without params.
        Can be queried by either "eraId", "blockHeight" or "timestamp" (e.g. "2021-04-09T09:31:36Z").
        Order example: "stakedDiffSinceGenesis DESC". Max limit is 1000;
        `,
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: rest_1.getModelSchemaRef(models_1.Era, { includeRelations: false }),
                },
            },
        },
    }),
    tslib_1.__param(0, rest_1.param.query.number('id')),
    tslib_1.__param(1, rest_1.param.query.number('blockHeight')),
    tslib_1.__param(2, rest_1.param.query.dateTime('timestamp')),
    tslib_1.__param(3, rest_1.param.query.number('limit')),
    tslib_1.__param(4, rest_1.param.query.string('order')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Number, Number, String, Number, Array]),
    tslib_1.__metadata("design:returntype", Promise)
], EraController.prototype, "find", null);
EraController = tslib_1.__decorate([
    tslib_1.__param(0, repository_1.repository(repositories_1.EraRepository)),
    tslib_1.__metadata("design:paramtypes", [repositories_1.EraRepository])
], EraController);
exports.EraController = EraController;
//# sourceMappingURL=era.controller.js.map