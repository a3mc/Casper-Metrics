"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFound = void 0;
class NotFound extends Error {
    constructor(message = 'Not found.') {
        super(message);
        this.statusCode = 404;
    }
}
exports.NotFound = NotFound;
//# sourceMappingURL=errors.js.map