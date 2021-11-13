"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@loopback/core");
const redis = tslib_1.__importStar(require("redis"));
const util_1 = require("util");
const environment_1 = require("../environments/environment");
let RedisService = class RedisService {
    constructor() {
        this.client = this._createClient();
        this.pub = this._createClient();
        this.sub = this._createClient();
    }
    _createClient() {
        const client = redis.createClient({ db: environment_1.environment.redis_database });
        return {
            client: client,
            getAsync: util_1.promisify(client.get).bind(client),
            setAsync: util_1.promisify(client.set).bind(client),
            incrbyAsync: util_1.promisify(client.incrby).bind(client),
            decrbyAsync: util_1.promisify(client.decrby).bind(client),
        };
    }
};
RedisService = tslib_1.__decorate([
    core_1.injectable({ scope: core_1.BindingScope.TRANSIENT }),
    tslib_1.__metadata("design:paramtypes", [])
], RedisService);
exports.RedisService = RedisService;
//# sourceMappingURL=redis.service.js.map