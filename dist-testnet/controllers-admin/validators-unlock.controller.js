"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidatorsUnlockController = void 0;
const tslib_1 = require("tslib");
const repository_1 = require("@loopback/repository");
const rest_1 = require("@loopback/rest");
const models_1 = require("../models");
const repositories_1 = require("../repositories");
const environment_1 = require("../environments/environment");
const moment_1 = tslib_1.__importDefault(require("moment"));
const core_1 = require("@loopback/core");
const services_1 = require("../services");
let ValidatorsUnlockController = class ValidatorsUnlockController {
    constructor(validatorsUnlockRepository, validatorsUnlockConstantsRepository, circulatingService) {
        this.validatorsUnlockRepository = validatorsUnlockRepository;
        this.validatorsUnlockConstantsRepository = validatorsUnlockConstantsRepository;
        this.circulatingService = circulatingService;
    }
    async create(amount) {
        await this.validatorsUnlockConstantsRepository.deleteAll();
        const unlock365 = BigInt(amount) * BigInt(1000000000);
        const unlock90 = BigInt(environment_1.environment.genesis_validators_weights_total) * BigInt(1000000000) - unlock365;
        await this.validatorsUnlockConstantsRepository.create({
            unlock90: unlock90.toString(),
            unlock365: unlock365.toString(),
        });
        await this.calculateValidatorsUnlocks();
    }
    async findAll() {
        let validatorsUnlocks = await this.validatorsUnlockConstantsRepository.find();
        if (!validatorsUnlocks.length) {
            await this.calculateValidatorsUnlocks();
            validatorsUnlocks = await this.validatorsUnlockConstantsRepository.find();
        }
        return validatorsUnlocks;
    }
    async calculateValidatorsUnlocks() {
        let validatorsUnlockConstants = await this.validatorsUnlockConstantsRepository.findOne();
        await this.validatorsUnlockRepository.deleteAll();
        if (!validatorsUnlockConstants) {
            validatorsUnlockConstants = await this.validatorsUnlockConstantsRepository.create({
                unlock90: '0',
                unlock365: '0'
            });
        }
        for (let day = 0; day < 14; day++) {
            await this.validatorsUnlockRepository.create({
                amount: ((BigInt(validatorsUnlockConstants.unlock90) / BigInt(14))).toString(),
                day: 90 + day,
                timestamp: moment_1.default(environment_1.environment.genesis_timestamp).add(90 + day, 'days').toISOString()
            });
        }
        await this.validatorsUnlockRepository.create({
            amount: (BigInt(validatorsUnlockConstants.unlock365)).toString(),
            day: 365,
            timestamp: moment_1.default(environment_1.environment.genesis_timestamp).add(365, 'days').toISOString()
        });
        await this.circulatingService.calculateCirculatingSupply();
    }
};
tslib_1.__decorate([
    rest_1.post('/api/validators-unlock'),
    rest_1.response(200, {
        description: 'ValidatorsUnlock model instance',
        content: { 'application/json': { schema: rest_1.getModelSchemaRef(models_1.ValidatorsUnlock) } },
    }),
    tslib_1.__param(0, rest_1.param.query.number('amount')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Number]),
    tslib_1.__metadata("design:returntype", Promise)
], ValidatorsUnlockController.prototype, "create", null);
tslib_1.__decorate([
    rest_1.get('/api/validators-unlock'),
    rest_1.response(200, {
        description: 'Array of ValidatorsUnlock model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: rest_1.getModelSchemaRef(models_1.ValidatorsUnlock, { includeRelations: false }),
                },
            },
        },
    }),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], ValidatorsUnlockController.prototype, "findAll", null);
ValidatorsUnlockController = tslib_1.__decorate([
    tslib_1.__param(0, repository_1.repository(repositories_1.ValidatorsUnlockRepository)),
    tslib_1.__param(1, repository_1.repository(repositories_1.ValidatorsUnlockConstantsRepository)),
    tslib_1.__param(2, core_1.service(services_1.CirculatingService)),
    tslib_1.__metadata("design:paramtypes", [repositories_1.ValidatorsUnlockRepository,
        repositories_1.ValidatorsUnlockConstantsRepository,
        services_1.CirculatingService])
], ValidatorsUnlockController);
exports.ValidatorsUnlockController = ValidatorsUnlockController;
//# sourceMappingURL=validators-unlock.controller.js.map