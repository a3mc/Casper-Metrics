"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CirculatingController = void 0;
const tslib_1 = require("tslib");
const repository_1 = require("@loopback/repository");
const rest_1 = require("@loopback/rest");
const models_1 = require("../models");
const repositories_1 = require("../repositories");
let CirculatingController = class CirculatingController {
    constructor(circulatingRepository) {
        this.circulatingRepository = circulatingRepository;
    }
    async create(circulating) {
        return this.circulatingRepository.create(circulating);
    }
    async count(where) {
        return this.circulatingRepository.count(where);
    }
    async find(filter) {
        return this.circulatingRepository.find(filter);
    }
    async updateAll(circulating, where) {
        return this.circulatingRepository.updateAll(circulating, where);
    }
    async findById(id, filter) {
        return this.circulatingRepository.findById(id, filter);
    }
    async updateById(id, circulating) {
        await this.circulatingRepository.updateById(id, circulating);
    }
    async replaceById(id, circulating) {
        await this.circulatingRepository.replaceById(id, circulating);
    }
    async deleteById(id) {
        await this.circulatingRepository.deleteById(id);
    }
};
tslib_1.__decorate([
    rest_1.post('/api/circulating'),
    rest_1.response(200, {
        description: 'Circulating model instance',
        content: { 'application/json': { schema: rest_1.getModelSchemaRef(models_1.Circulating) } },
    }),
    tslib_1.__param(0, rest_1.requestBody({
        content: {
            'application/json': {
                schema: rest_1.getModelSchemaRef(models_1.Circulating, {
                    title: 'NewCirculating',
                    exclude: ['id'],
                }),
            },
        },
    })),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], CirculatingController.prototype, "create", null);
tslib_1.__decorate([
    rest_1.get('/api/circulating/count'),
    rest_1.response(200, {
        description: 'Circulating model count',
        content: { 'application/json': { schema: repository_1.CountSchema } },
    }),
    tslib_1.__param(0, rest_1.param.where(models_1.Circulating)),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], CirculatingController.prototype, "count", null);
tslib_1.__decorate([
    rest_1.get('/api/circulating'),
    rest_1.response(200, {
        description: 'Array of Circulating model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: rest_1.getModelSchemaRef(models_1.Circulating, { includeRelations: true }),
                },
            },
        },
    }),
    tslib_1.__param(0, rest_1.param.filter(models_1.Circulating)),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], CirculatingController.prototype, "find", null);
tslib_1.__decorate([
    rest_1.patch('/api/circulating'),
    rest_1.response(200, {
        description: 'Circulating PATCH success count',
        content: { 'application/json': { schema: repository_1.CountSchema } },
    }),
    tslib_1.__param(0, rest_1.requestBody({
        content: {
            'application/json': {
                schema: rest_1.getModelSchemaRef(models_1.Circulating, { partial: true }),
            },
        },
    })),
    tslib_1.__param(1, rest_1.param.where(models_1.Circulating)),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [models_1.Circulating, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], CirculatingController.prototype, "updateAll", null);
tslib_1.__decorate([
    rest_1.get('/api/circulating/{id}'),
    rest_1.response(200, {
        description: 'Circulating model instance',
        content: {
            'application/json': {
                schema: rest_1.getModelSchemaRef(models_1.Circulating, { includeRelations: true }),
            },
        },
    }),
    tslib_1.__param(0, rest_1.param.path.number('id')),
    tslib_1.__param(1, rest_1.param.filter(models_1.Circulating, { exclude: 'where' })),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Number, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], CirculatingController.prototype, "findById", null);
tslib_1.__decorate([
    rest_1.patch('/api/circulating/{id}'),
    rest_1.response(204, {
        description: 'Circulating PATCH success',
    }),
    tslib_1.__param(0, rest_1.param.path.number('id')),
    tslib_1.__param(1, rest_1.requestBody({
        content: {
            'application/json': {
                schema: rest_1.getModelSchemaRef(models_1.Circulating, { partial: true }),
            },
        },
    })),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Number, models_1.Circulating]),
    tslib_1.__metadata("design:returntype", Promise)
], CirculatingController.prototype, "updateById", null);
tslib_1.__decorate([
    rest_1.put('/api/circulating/{id}'),
    rest_1.response(204, {
        description: 'Circulating PUT success',
    }),
    tslib_1.__param(0, rest_1.param.path.number('id')),
    tslib_1.__param(1, rest_1.requestBody()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Number, models_1.Circulating]),
    tslib_1.__metadata("design:returntype", Promise)
], CirculatingController.prototype, "replaceById", null);
tslib_1.__decorate([
    rest_1.del('/api/circulating/{id}'),
    rest_1.response(204, {
        description: 'Circulating DELETE success',
    }),
    tslib_1.__param(0, rest_1.param.path.number('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Number]),
    tslib_1.__metadata("design:returntype", Promise)
], CirculatingController.prototype, "deleteById", null);
CirculatingController = tslib_1.__decorate([
    tslib_1.__param(0, repository_1.repository(repositories_1.CirculatingRepository)),
    tslib_1.__metadata("design:paramtypes", [repositories_1.CirculatingRepository])
], CirculatingController);
exports.CirculatingController = CirculatingController;
//# sourceMappingURL=circulating.controller.js.map