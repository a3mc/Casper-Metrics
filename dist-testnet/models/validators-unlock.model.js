"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidatorsUnlock = void 0;
const tslib_1 = require("tslib");
const repository_1 = require("@loopback/repository");
let ValidatorsUnlock = class ValidatorsUnlock extends repository_1.Entity {
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
], ValidatorsUnlock.prototype, "id", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'number',
        required: true,
    }),
    tslib_1.__metadata("design:type", Number)
], ValidatorsUnlock.prototype, "day", void 0);
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
], ValidatorsUnlock.prototype, "timestamp", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'string',
        required: true,
    }),
    tslib_1.__metadata("design:type", String)
], ValidatorsUnlock.prototype, "amount", void 0);
ValidatorsUnlock = tslib_1.__decorate([
    repository_1.model(),
    tslib_1.__metadata("design:paramtypes", [Object])
], ValidatorsUnlock);
exports.ValidatorsUnlock = ValidatorsUnlock;
//# sourceMappingURL=validators-unlock.model.js.map