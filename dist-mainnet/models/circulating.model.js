"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Circulating = void 0;
const tslib_1 = require("tslib");
const repository_1 = require("@loopback/repository");
let Circulating = class Circulating extends repository_1.Entity {
    constructor(data) {
        super(data);
    }
};
tslib_1.__decorate([
    repository_1.property({
        type: 'number',
        id: true,
        generated: true,
    }),
    tslib_1.__metadata("design:type", Number)
], Circulating.prototype, "id", void 0);
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
], Circulating.prototype, "timestamp", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'number',
        required: true,
    }),
    tslib_1.__metadata("design:type", Number)
], Circulating.prototype, "blockHeight", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'number',
        required: true,
    }),
    tslib_1.__metadata("design:type", Number)
], Circulating.prototype, "eraId", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'string',
    }),
    tslib_1.__metadata("design:type", String)
], Circulating.prototype, "unlock", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'string',
    }),
    tslib_1.__metadata("design:type", String)
], Circulating.prototype, "deployHash", void 0);
Circulating = tslib_1.__decorate([
    repository_1.model(),
    tslib_1.__metadata("design:paramtypes", [Object])
], Circulating);
exports.Circulating = Circulating;
//# sourceMappingURL=circulating.model.js.map