"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnownAccount = void 0;
const tslib_1 = require("tslib");
const repository_1 = require("@loopback/repository");
let KnownAccount = class KnownAccount extends repository_1.Entity {
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
], KnownAccount.prototype, "id", void 0);
tslib_1.__decorate([
    repository_1.property({
        required: true,
        type: 'string',
        length: 80,
        mysql: {
            columnName: 'hash',
            dataType: 'varchar',
            dataLength: 80,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        }
    }),
    tslib_1.__metadata("design:type", String)
], KnownAccount.prototype, "hash", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'string',
        length: 80,
        required: false,
        mysql: {
            columnName: 'hex',
            dataType: 'varchar',
            dataLength: 80,
            dataPrecision: null,
            dataScale: null,
            nullable: 'Y',
        }
    }),
    tslib_1.__metadata("design:type", String)
], KnownAccount.prototype, "hex", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'string',
        length: 32,
        required: false,
        mysql: {
            columnName: 'name',
            dataType: 'varchar',
            dataLength: 32,
            dataPrecision: null,
            dataScale: null,
            nullable: 'Y',
        }
    }),
    tslib_1.__metadata("design:type", String)
], KnownAccount.prototype, "name", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'string',
        required: false,
        length: 255,
        mysql: {
            columnName: 'comment',
            dataType: 'varchar',
            dataLength: 255,
            dataPrecision: null,
            dataScale: null,
            nullable: 'Y',
        }
    }),
    tslib_1.__metadata("design:type", String)
], KnownAccount.prototype, "comment", void 0);
KnownAccount = tslib_1.__decorate([
    repository_1.model(),
    tslib_1.__metadata("design:paramtypes", [Object])
], KnownAccount);
exports.KnownAccount = KnownAccount;
//# sourceMappingURL=known-account.model.js.map