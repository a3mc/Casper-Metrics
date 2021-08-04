import { inject, lifeCycleObserver, LifeCycleObserver } from '@loopback/core';
import { juggler } from '@loopback/repository';
import { environment } from "../environments/environment";

const config = {
    name: 'metricsDB',
    connector: 'mysql',
    url: '',
    host: 'localhost',
    port: 3306,
    user: 'USER',
    password: 'PASSWORD',
    database: environment.database,
    supportBigNumbers: true,
    connectTimeout: 120000,
    acquireTimeout: 120000,
    connectionLimit: 200,
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver( 'datasource' )
export class MetricsDbDataSource extends juggler.DataSource
    implements LifeCycleObserver {
    static dataSourceName = 'metricsDB';
    static readonly defaultConfig = config;

    constructor(
        @inject( 'datasources.config.metricsDB', { optional: true } )
            dsConfig: object = config,
    ) {
        super( dsConfig );
    }
}
