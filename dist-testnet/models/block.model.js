"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Block = void 0;
const tslib_1 = require("tslib");
const repository_1 = require("@loopback/repository");
let Block = class Block extends repository_1.Entity {
    constructor(data) {
        super(data);
    }
};
tslib_1.__decorate([
    repository_1.property({
        type: 'number',
        required: true,
        precision: 10,
        scale: 0,
        id: 1,
        mysql: { columnName: 'id', dataType: 'int', dataLength: null, dataPrecision: 10, dataScale: 0, nullable: 'N' },
    }),
    tslib_1.__metadata("design:type", Number)
], Block.prototype, "blockHeight", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'number',
        required: true,
        precision: 10,
        scale: 0,
        id: 1,
        mysql: {
            columnName: 'era_id',
            dataType: 'int',
            dataLength: null,
            dataPrecision: 10,
            dataScale: 0,
            nullable: 'N'
        },
    }),
    tslib_1.__metadata("design:type", Number)
], Block.prototype, "eraId", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'circulating_supply',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    }),
    tslib_1.__metadata("design:type", Object)
], Block.prototype, "circulatingSupply", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'validators_weight',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    }),
    tslib_1.__metadata("design:type", typeof BigInt === "function" ? BigInt : Object)
], Block.prototype, "validatorsWeights", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'Number',
        required: true,
        mysql: {
            columnName: 'total_supply',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        },
    }),
    tslib_1.__metadata("design:type", typeof BigInt === "function" ? BigInt : Object)
], Block.prototype, "totalSupply", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'string',
        required: true,
        length: 64,
        mysql: {
            columnName: 'state_root_hash',
            dataType: 'varchar',
            dataLength: 64,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        },
    }),
    tslib_1.__metadata("design:type", String)
], Block.prototype, "stateRootHash", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'number',
        required: false,
        precision: 10,
        scale: 0,
        mysql: {
            columnName: 'transfers_count',
            dataType: 'int',
            dataLength: null,
            dataPrecision: 10,
            dataScale: 0,
            nullable: 'N',
            default: 0,
        },
    }),
    tslib_1.__metadata("design:type", Number)
], Block.prototype, "transfersCount", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'number',
        required: false,
        precision: 10,
        scale: 0,
        mysql: {
            columnName: 'deploys_count',
            dataType: 'int',
            dataLength: null,
            dataPrecision: 10,
            dataScale: 0,
            nullable: 'N',
            default: 0,
        },
    }),
    tslib_1.__metadata("design:type", Number)
], Block.prototype, "deploysCount", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'Number',
        required: true,
        mysql: {
            columnName: 'staked_this_block',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        },
    }),
    tslib_1.__metadata("design:type", typeof BigInt === "function" ? BigInt : Object)
], Block.prototype, "stakedThisBlock", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'next_era_validators_weights',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    }),
    tslib_1.__metadata("design:type", typeof BigInt === "function" ? BigInt : Object)
], Block.prototype, "nextEraValidatorsWeights", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'validators_rewards',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    }),
    tslib_1.__metadata("design:type", typeof BigInt === "function" ? BigInt : Object)
], Block.prototype, "validatorsRewards", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'delegators_rewards',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    }),
    tslib_1.__metadata("design:type", typeof BigInt === "function" ? BigInt : Object)
], Block.prototype, "delegatorsRewards", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'rewards',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    }),
    tslib_1.__metadata("design:type", typeof BigInt === "function" ? BigInt : Object)
], Block.prototype, "rewards", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'number',
        required: false,
        precision: 10,
        scale: 0,
        mysql: {
            columnName: 'validators_count',
            dataType: 'int',
            dataLength: null,
            dataPrecision: 10,
            dataScale: 0,
            nullable: 'N',
            default: 0,
        },
    }),
    tslib_1.__metadata("design:type", Number)
], Block.prototype, "validatorsCount", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'number',
        required: false,
        precision: 10,
        scale: 0,
        mysql: {
            columnName: 'delegators_count',
            dataType: 'int',
            dataLength: null,
            dataPrecision: 10,
            dataScale: 0,
            nullable: 'N',
            default: 0,
        },
    }),
    tslib_1.__metadata("design:type", Number)
], Block.prototype, "delegatorsCount", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'boolean',
        required: false,
        mysql: {
            columnName: 'switch',
            dataType: 'Boolean',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: false
        },
    }),
    tslib_1.__metadata("design:type", Boolean)
], Block.prototype, "switch", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'Number',
        required: true,
        mysql: {
            columnName: 'unstaked_this_block',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        },
    }),
    tslib_1.__metadata("design:type", typeof BigInt === "function" ? BigInt : Object)
], Block.prototype, "undelegatedThisBlock", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'staked_diff_this_block',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    }),
    tslib_1.__metadata("design:type", typeof BigInt === "function" ? BigInt : Object)
], Block.prototype, "stakedDiffThisBlock", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'staked_diff_since_genesis',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    }),
    tslib_1.__metadata("design:type", typeof BigInt === "function" ? BigInt : Object)
], Block.prototype, "stakedDiffSinceGenesis", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'string',
        required: false,
        length: 64,
        mysql: {
            columnName: 'exact_staked_diff_since_genesis',
            dataType: 'varchar',
            dataLength: 64,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: '0',
        },
    }),
    tslib_1.__metadata("design:type", String)
], Block.prototype, "stakedDiffSinceGenesisMotes", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'date',
        required: true,
        mysql: {
            columnName: 'timestamp',
            dataType: 'timestamp',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        },
    }),
    tslib_1.__metadata("design:type", String)
], Block.prototype, "timestamp", void 0);
Block = tslib_1.__decorate([
    repository_1.model(),
    tslib_1.__metadata("design:paramtypes", [Object])
], Block);
exports.Block = Block;
//# sourceMappingURL=block.model.js.map