"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transfer = void 0;
const tslib_1 = require("tslib");
const repository_1 = require("@loopback/repository");
let Transfer = class Transfer extends repository_1.Entity {
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
], Transfer.prototype, "id", void 0);
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
], Transfer.prototype, "timestamp", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'number',
        required: true,
    }),
    tslib_1.__metadata("design:type", Number)
], Transfer.prototype, "depth", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'boolean',
        required: false,
        default: false,
    }),
    tslib_1.__metadata("design:type", Boolean)
], Transfer.prototype, "approved", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'number',
        required: true,
    }),
    tslib_1.__metadata("design:type", Number)
], Transfer.prototype, "blockHeight", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'string',
        required: true,
        length: 80,
        mysql: {
            columnName: 'deployhash',
            dataType: 'varchar',
            dataLength: 80,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        }
    }),
    tslib_1.__metadata("design:type", String)
], Transfer.prototype, "deployHash", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'string',
        required: true,
        length: 80,
        mysql: {
            columnName: 'from',
            dataType: 'varchar',
            dataLength: 80,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        }
    }),
    tslib_1.__metadata("design:type", String)
], Transfer.prototype, "from", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'string',
        required: true,
        length: 80,
        mysql: {
            columnName: 'fromhash',
            dataType: 'varchar',
            dataLength: 80,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        }
    }),
    tslib_1.__metadata("design:type", String)
], Transfer.prototype, "fromHash", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'string',
        length: 80,
        mysql: {
            columnName: 'to',
            dataType: 'varchar',
            dataLength: 80,
            dataPrecision: null,
            dataScale: null,
            nullable: 'Y'
        }
    }),
    tslib_1.__metadata("design:type", String)
], Transfer.prototype, "to", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'string',
        required: true,
        length: 80,
        mysql: {
            columnName: 'tohash',
            dataType: 'varchar',
            dataLength: 80,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        }
    }),
    tslib_1.__metadata("design:type", String)
], Transfer.prototype, "toHash", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'string',
        required: true,
        length: 25,
        mysql: {
            columnName: 'amount',
            dataType: 'varchar',
            dataLength: 25,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        }
    }),
    tslib_1.__metadata("design:type", String)
], Transfer.prototype, "amount", void 0);
Transfer = tslib_1.__decorate([
    repository_1.model(),
    tslib_1.__metadata("design:paramtypes", [Object])
], Transfer);
exports.Transfer = Transfer;
//# sourceMappingURL=transfer.model.js.map