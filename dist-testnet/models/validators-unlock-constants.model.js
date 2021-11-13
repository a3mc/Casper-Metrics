"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidatorsUnlockConstants = void 0;
const tslib_1 = require("tslib");
const repository_1 = require("@loopback/repository");
let ValidatorsUnlockConstants = class ValidatorsUnlockConstants extends repository_1.Entity {
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
], ValidatorsUnlockConstants.prototype, "id", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'string',
        required: true,
    }),
    tslib_1.__metadata("design:type", String)
], ValidatorsUnlockConstants.prototype, "unlock90", void 0);
tslib_1.__decorate([
    repository_1.property({
        type: 'string',
        required: true,
    }),
    tslib_1.__metadata("design:type", String)
], ValidatorsUnlockConstants.prototype, "unlock365", void 0);
ValidatorsUnlockConstants = tslib_1.__decorate([
    repository_1.model(),
    tslib_1.__metadata("design:paramtypes", [Object])
], ValidatorsUnlockConstants);
exports.ValidatorsUnlockConstants = ValidatorsUnlockConstants;
//# sourceMappingURL=validators-unlock-constants.model.js.map