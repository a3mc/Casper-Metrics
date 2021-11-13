"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyAdminSequence = void 0;
const tslib_1 = require("tslib");
const rest_1 = require("@loopback/rest");
const core_1 = require("@loopback/core");
let MyAdminSequence = class MyAdminSequence {
    constructor(findRoute, parseParams, invoke, send, reject) {
        this.findRoute = findRoute;
        this.parseParams = parseParams;
        this.invoke = invoke;
        this.send = send;
        this.reject = reject;
    }
    async handle(context) {
        try {
            // First we try to find a matching route in the api
            const { request, response } = context;
            const route = this.findRoute(request);
            const args = await this.parseParams(request, route);
            const result = await this.invoke(route, args);
            this.send(response, result);
        }
        catch (err) {
            if (err.statusCode === 404) {
                context.response.sendFile('dist-admin/index.html', { root: './' });
            }
            else {
                this.reject(context, err);
            }
        }
    }
};
MyAdminSequence = tslib_1.__decorate([
    tslib_1.__param(0, core_1.inject(rest_1.SequenceActions.FIND_ROUTE)),
    tslib_1.__param(1, core_1.inject(rest_1.SequenceActions.PARSE_PARAMS)),
    tslib_1.__param(2, core_1.inject(rest_1.SequenceActions.INVOKE_METHOD)),
    tslib_1.__param(3, core_1.inject(rest_1.SequenceActions.SEND)),
    tslib_1.__param(4, core_1.inject(rest_1.SequenceActions.REJECT)),
    tslib_1.__metadata("design:paramtypes", [Function, Function, Function, Function, Function])
], MyAdminSequence);
exports.MyAdminSequence = MyAdminSequence;
//# sourceMappingURL=sequence-admin.js.map