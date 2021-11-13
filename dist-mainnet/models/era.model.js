"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Era = void 0;
const tslib_1 = require("tslib");
const repository_1 = require("@loopback/repository");
let Era = class Era extends repository_1.Entity {
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
], Era.prototype, "id", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'number',
        required: true,
        precision: 10,
        scale: 0,
        mysql: {
            columnName: 'start_block',
            dataType: 'int',
            dataLength: null,
            dataPrecision: 10,
            dataScale: 0,
            nullable: 'N'
        },
    }),
    tslib_1.__metadata("design:type", Number)
], Era.prototype, "startBlock", void 0);
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
], Era.prototype, "transfersCount", void 0);
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
], Era.prototype, "deploysCount", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'number',
        required: false,
        precision: 10,
        scale: 0,
        mysql: {
            columnName: 'end_block',
            dataType: 'int',
            dataLength: null,
            dataPrecision: 10,
            dataScale: 0,
            nullable: 'Y'
        },
    }),
    tslib_1.__metadata("design:type", Number)
], Era.prototype, "endBlock", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'date',
        required: true,
        mysql: {
            columnName: 'start',
            dataType: 'timestamp',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        },
    }),
    tslib_1.__metadata("design:type", String)
], Era.prototype, "start", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'date',
        required: false,
        mysql: {
            columnName: 'end',
            dataType: 'timestamp',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'Y'
        },
    }),
    tslib_1.__metadata("design:type", String)
], Era.prototype, "end", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'Number',
        required: true,
        mysql: {
            columnName: 'circulating_supply',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        },
    }),
    tslib_1.__metadata("design:type", typeof BigInt === "function" ? BigInt : Object)
], Era.prototype, "circulatingSupply", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'Number',
        required: true,
        mysql: {
            columnName: 'validators_weights',
            dataType: 'bigint',
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
        },
    }),
    tslib_1.__metadata("design:type", typeof BigInt === "function" ? BigInt : Object)
], Era.prototype, "validatorsWeights", void 0);
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
], Era.prototype, "totalSupply", void 0);
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
], Era.prototype, "validatorsRewards", void 0);
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
], Era.prototype, "delegatorsRewards", void 0);
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
], Era.prototype, "rewards", void 0);
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
], Era.prototype, "validatorsCount", void 0);
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
], Era.prototype, "delegatorsCount", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'staked_this_era',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    }),
    tslib_1.__metadata("design:type", typeof BigInt === "function" ? BigInt : Object)
], Era.prototype, "stakedThisEra", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'unstaked_this_era',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    }),
    tslib_1.__metadata("design:type", typeof BigInt === "function" ? BigInt : Object)
], Era.prototype, "undelegatedThisEra", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'staked_diff_this_era',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    }),
    tslib_1.__metadata("design:type", typeof BigInt === "function" ? BigInt : Object)
], Era.prototype, "stakedDiffThisEra", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'Number',
        required: true,
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
], Era.prototype, "stakedDiffSinceGenesis", void 0);
Era = tslib_1.__decorate([
    repository_1.model(),
    tslib_1.__metadata("design:paramtypes", [Object])
], Era);
exports.Era = Era;
//# sourceMappingURL=era.model.js.map