"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnownAccountController = void 0;
const tslib_1 = require("tslib");
const repository_1 = require("@loopback/repository");
const rest_1 = require("@loopback/rest");
const models_1 = require("../models");
const repositories_1 = require("../repositories");
let KnownAccountController = class KnownAccountController {
    constructor(knownAccountsRepository) {
        this.knownAccountsRepository = knownAccountsRepository;
    }
    async create(knownAccounts) {
        return this.knownAccountsRepository.create(knownAccounts);
    }
    async count(where) {
        return this.knownAccountsRepository.count(where);
    }
    async find(filter) {
        return this.knownAccountsRepository.find(filter);
    }
    async updateAll(knownAccounts, where) {
        return this.knownAccountsRepository.updateAll(knownAccounts, where);
    }
    async findById(id, filter) {
        return this.knownAccountsRepository.findById(id, filter);
    }
    async updateById(id, knownAccounts) {
        await this.knownAccountsRepository.updateById(id, knownAccounts);
    }
    async replaceById(id, knownAccounts) {
        await this.knownAccountsRepository.replaceById(id, knownAccounts);
    }
    async deleteById(id) {
        await this.knownAccountsRepository.deleteById(id);
    }
};
tslib_1.__decorate([
    rest_1.post('/api/known-account'),
    rest_1.response(200, {
        description: 'KnownAccount model instance',
        content: { 'application/json': { schema: rest_1.getModelSchemaRef(models_1.KnownAccount) } },
    }),
    tslib_1.__param(0, rest_1.requestBody({
        content: {
            'application/json': {
                schema: rest_1.getModelSchemaRef(models_1.KnownAccount, {
                    title: 'NewKnownAccount',
                    exclude: ['id'],
                }),
            },
        },
    })),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], KnownAccountController.prototype, "create", null);
tslib_1.__decorate([
    rest_1.get('/api/known-account/count'),
    rest_1.response(200, {
        description: 'KnownAccount model count',
        content: { 'application/json': { schema: repository_1.CountSchema } },
    }),
    tslib_1.__param(0, rest_1.param.where(models_1.KnownAccount)),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], KnownAccountController.prototype, "count", null);
tslib_1.__decorate([
    rest_1.get('/api/known-account'),
    rest_1.response(200, {
        description: 'Array of KnownAccount model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: rest_1.getModelSchemaRef(models_1.KnownAccount, { includeRelations: true }),
                },
            },
        },
    }),
    tslib_1.__param(0, rest_1.param.filter(models_1.KnownAccount)),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], KnownAccountController.prototype, "find", null);
tslib_1.__decorate([
    rest_1.patch('/api/known-account'),
    rest_1.response(200, {
        description: 'KnownAccount PATCH success count',
        content: { 'application/json': { schema: repository_1.CountSchema } },
    }),
    tslib_1.__param(0, rest_1.requestBody({
        content: {
            'application/json': {
                schema: rest_1.getModelSchemaRef(models_1.KnownAccount, { partial: true }),
            },
        },
    })),
    tslib_1.__param(1, rest_1.param.where(models_1.KnownAccount)),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [models_1.KnownAccount, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], KnownAccountController.prototype, "updateAll", null);
tslib_1.__decorate([
    rest_1.get('/api/known-account/{id}'),
    rest_1.response(200, {
        description: 'KnownAccount model instance',
        content: {
            'application/json': {
                schema: rest_1.getModelSchemaRef(models_1.KnownAccount, { includeRelations: true }),
            },
        },
    }),
    tslib_1.__param(0, rest_1.param.path.number('id')),
    tslib_1.__param(1, rest_1.param.filter(models_1.KnownAccount, { exclude: 'where' })),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Number, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], KnownAccountController.prototype, "findById", null);
tslib_1.__decorate([
    rest_1.patch('/api/known-account/{id}'),
    rest_1.response(204, {
        description: 'KnownAccount PATCH success',
    }),
    tslib_1.__param(0, rest_1.param.path.number('id')),
    tslib_1.__param(1, rest_1.requestBody({
        content: {
            'application/json': {
                schema: rest_1.getModelSchemaRef(models_1.KnownAccount, { partial: true }),
            },
        },
    })),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Number, models_1.KnownAccount]),
    tslib_1.__metadata("design:returntype", Promise)
], KnownAccountController.prototype, "updateById", null);
tslib_1.__decorate([
    rest_1.put('/api/known-account/{id}'),
    rest_1.response(204, {
        description: 'KnownAccount PUT success',
    }),
    tslib_1.__param(0, rest_1.param.path.number('id')),
    tslib_1.__param(1, rest_1.requestBody()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Number, models_1.KnownAccount]),
    tslib_1.__metadata("design:returntype", Promise)
], KnownAccountController.prototype, "replaceById", null);
tslib_1.__decorate([
    rest_1.del('/api/known-account/{id}'),
    rest_1.response(204, {
        description: 'KnownAccount DELETE success',
    }),
    tslib_1.__param(0, rest_1.param.path.number('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Number]),
    tslib_1.__metadata("design:returntype", Promise)
], KnownAccountController.prototype, "deleteById", null);
KnownAccountController = tslib_1.__decorate([
    tslib_1.__param(0, repository_1.repository(repositories_1.KnownAccountRepository)),
    tslib_1.__metadata("design:paramtypes", [repositories_1.KnownAccountRepository])
], KnownAccountController);
exports.KnownAccountController = KnownAccountController;
//# sourceMappingURL=known-accounts.controller.js.map