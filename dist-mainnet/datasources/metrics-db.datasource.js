"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsDbDataSource = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@loopback/core");
const repository_1 = require("@loopback/repository");
const environment_1 = require("../environments/environment");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    name: 'metricsDB',
    connector: 'mysql',
    url: '',
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: environment_1.environment.database,
    supportBigNumbers: true,
    connectTimeout: 20000,
    acquireTimeout: 20000,
    connectionLimit: 3, //200,
};
// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
let MetricsDbDataSource = class MetricsDbDataSource extends repository_1.juggler.DataSource {
    constructor(dsConfig = config) {
        super(dsConfig);
    }
};
MetricsDbDataSource.dataSourceName = 'metricsDB';
MetricsDbDataSource.defaultConfig = config;
MetricsDbDataSource = tslib_1.__decorate([
    core_1.lifeCycleObserver('datasource'),
    tslib_1.__param(0, core_1.inject('datasources.config.metricsDB', { optional: true })),
    tslib_1.__metadata("design:paramtypes", [Object])
], MetricsDbDataSource);
exports.MetricsDbDataSource = MetricsDbDataSource;
//# sourceMappingURL=metrics-db.datasource.js.map