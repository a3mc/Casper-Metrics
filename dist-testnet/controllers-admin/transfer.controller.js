"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferController = void 0;
const tslib_1 = require("tslib");
const repository_1 = require("@loopback/repository");
const rest_1 = require("@loopback/rest");
const models_1 = require("../models");
const repositories_1 = require("../repositories");
const core_1 = require("@loopback/core");
const services_1 = require("../services");
const clone = require('node-clone-js');
let TransferController = class TransferController {
    constructor(transferRepository, circulatingRepository, blockRepository, eraRepository, circulatingService) {
        this.transferRepository = transferRepository;
        this.circulatingRepository = circulatingRepository;
        this.blockRepository = blockRepository;
        this.eraRepository = eraRepository;
        this.circulatingService = circulatingService;
    }
    async count(where) {
        return this.transferRepository.count(where);
    }
    async find(toHash, fromHash, approved, perPage, page) {
        let filter = {
            where: {
                and: [
                    { depth: { lt: 3 } },
                    { depth: { gt: 0 } },
                ]
            }
        };
        if (toHash) {
            filter = {
                where: {
                    toHash: toHash
                }
            };
        }
        if (fromHash) {
            filter = {
                where: {
                    fromHash: fromHash
                }
            };
        }
        if (approved) {
            filter = {
                where: {
                    approved: true
                }
            };
        }
        const allFilter = clone(filter);
        const approvedFilter = clone(filter);
        approvedFilter.where.approved = true;
        if (perPage && page) {
            filter.limit = perPage;
            filter.skip = perPage * (page - 1);
        }
        const data = await this.transferRepository.find(filter);
        const approvedItems = await this.transferRepository.find(approvedFilter);
        let approvedSum = approvedItems.reduce((a, b) => {
            return a + BigInt(b.amount);
        }, BigInt(0));
        const allData = await this.transferRepository.find(allFilter);
        let totalSum = allData.reduce((a, b) => {
            return a + BigInt(b.amount);
        }, BigInt(0));
        return {
            totalItems: await this.transferRepository.count(filter.where),
            approvedSum: Number(approvedSum / BigInt(1000000000)),
            totalSum: Number(totalSum / BigInt(1000000000)),
            data: data
        };
    }
    async approve(approvedIds, declinedIds) {
        if (approvedIds) {
            const approved = approvedIds.split(',').map(id => Number(id));
            for (const id of approved) {
                await this.transferRepository.updateById(id, {
                    approved: true
                });
            }
        }
        if (declinedIds) {
            const declined = declinedIds.split(',').map(id => Number(id));
            for (const id of declined) {
                await this.transferRepository.updateById(id, {
                    approved: false
                });
            }
        }
        const approvedTransfers = await this.transferRepository.find({
            where: {
                approved: true,
            },
            fields: ['timestamp', 'amount', 'deployHash', 'blockHeight']
        }).catch();
        await this.circulatingRepository.deleteAll({
            deployHash: { neq: '' }
        });
        if (approvedTransfers) {
            let circulating = [];
            for (const transfer of approvedTransfers) {
                const block = await this.blockRepository.findById(transfer.blockHeight, {
                    fields: ['eraId']
                });
                circulating.push({
                    timestamp: transfer.timestamp,
                    unlock: transfer.amount,
                    deployHash: transfer.deployHash,
                    blockHeight: transfer.blockHeight,
                    eraId: block.eraId
                });
            }
            await this.circulatingRepository.createAll(circulating);
        }
        await this.circulatingService.calculateCirculatingSupply();
    }
};
tslib_1.__decorate([
    rest_1.get('/api/transfers/count'),
    rest_1.response(200, {
        description: 'Transfer model count',
        content: { 'application/json': { schema: repository_1.CountSchema } },
    }),
    tslib_1.__param(0, rest_1.param.where(models_1.Transfer)),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], TransferController.prototype, "count", null);
tslib_1.__decorate([
    rest_1.get('/api/transfers'),
    rest_1.response(200, {
        description: 'Array of Transfer model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: rest_1.getModelSchemaRef(models_1.Transfer, { includeRelations: true }),
                },
            },
        },
    }),
    tslib_1.__param(0, rest_1.param.query.string('toHash')),
    tslib_1.__param(1, rest_1.param.query.string('fromHash')),
    tslib_1.__param(2, rest_1.param.query.string('approved')),
    tslib_1.__param(3, rest_1.param.query.number('perPage')),
    tslib_1.__param(4, rest_1.param.query.number('page')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, String, String, Number, Number]),
    tslib_1.__metadata("design:returntype", Promise)
], TransferController.prototype, "find", null);
tslib_1.__decorate([
    rest_1.post('/api/transfers/approve'),
    rest_1.response(200, {
        description: 'Approve transactions as unlocked',
    }),
    tslib_1.__param(0, rest_1.param.query.string('approvedIds')),
    tslib_1.__param(1, rest_1.param.query.string('declinedIds')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, String]),
    tslib_1.__metadata("design:returntype", Promise)
], TransferController.prototype, "approve", null);
TransferController = tslib_1.__decorate([
    tslib_1.__param(0, repository_1.repository(repositories_1.TransferRepository)),
    tslib_1.__param(1, repository_1.repository(repositories_1.CirculatingRepository)),
    tslib_1.__param(2, repository_1.repository(repositories_1.BlockRepository)),
    tslib_1.__param(3, repository_1.repository(repositories_1.EraRepository)),
    tslib_1.__param(4, core_1.service(services_1.CirculatingService)),
    tslib_1.__metadata("design:paramtypes", [repositories_1.TransferRepository,
        repositories_1.CirculatingRepository,
        repositories_1.BlockRepository,
        repositories_1.EraRepository,
        services_1.CirculatingService])
], TransferController);
exports.TransferController = TransferController;
//# sourceMappingURL=transfer.controller.js.map