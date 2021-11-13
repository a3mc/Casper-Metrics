"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = exports.main = void 0;
const tslib_1 = require("tslib");
const application_1 = require("./application");
const environment_1 = require("./environments/environment");
const application_admin_1 = require("./application-admin");
tslib_1.__exportStar(require("./application"), exports);
tslib_1.__exportStar(require("./application-admin"), exports);
async function main(options = {}) {
    const app = new application_1.CasperMetricsApplication(options);
    await app.boot();
    await app.start();
    const url = app.restServer.url;
    console.log(`Server is running at ${url}`);
    return app;
}
exports.main = main;
async function admin(options = {}) {
    const app = new application_admin_1.ApplicationAdmin(options);
    await app.boot();
    await app.start();
    const url = app.restServer.url;
    console.log(`Admin Server is running at ${url}`);
    return app;
}
exports.admin = admin;
if (require.main === module) {
    // Run the application
    const config = {
        shutdown: {
            gracePeriod: 5000
        },
        rest: {
            port: +((_a = process.env.PORT) !== null && _a !== void 0 ? _a : environment_1.environment.port),
            host: process.env.HOST,
            // The `gracePeriodForClose` provides a graceful close for http/https
            // servers with keep-alive clients. The default value is `Infinity`
            // (don't force-close). If you want to immediately destroy all sockets
            // upon stop, set its value to `0`.
            // See https://www.npmjs.com/package/stoppable
            gracePeriodForClose: 5000,
            openApiSpec: {
                // useful when used with OpenAPI-to-GraphQL to locate your application
                setServersFromRequest: true,
                disabled: true,
            },
            expressSettings: {
                'x-powered-by': false,
                env: 'production',
            },
            basePath: '/',
        },
    };
    main(config).catch(err => {
        console.error('Cannot start the application.', err);
        process.exit(1);
    });
    const adminConfig = {
        rest: {
            port: +((_b = process.env.ADMIN_PORT) !== null && _b !== void 0 ? _b : environment_1.environment.admin_port),
            host: process.env.HOST,
            // The `gracePeriodForClose` provides a graceful close for http/https
            // servers with keep-alive clients. The default value is `Infinity`
            // (don't force-close). If you want to immediately destroy all sockets
            // upon stop, set its value to `0`.
            // See https://www.npmjs.com/package/stoppable
            gracePeriodForClose: 5000,
            openApiSpec: {
                // useful when used with OpenAPI-to-GraphQL to locate your application
                setServersFromRequest: true,
                disabled: true,
            },
            expressSettings: {
                'x-powered-by': false,
                env: 'production',
            },
            basePath: '/',
        },
    };
    admin(adminConfig).catch(err => {
        console.error('Cannot start the admin application.', err);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map