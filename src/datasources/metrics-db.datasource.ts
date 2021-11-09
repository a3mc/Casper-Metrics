import { inject, lifeCycleObserver, LifeCycleObserver } from '@loopback/core';
import { juggler } from '@loopback/repository';
import { environment } from '../environments/environment';
import dotenv from 'dotenv';
dotenv.config();

const config = {
    name: 'metricsDB',
    connector: 'mysql',
    url: '',
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: environment.database,
    supportBigNumbers: true,
    connectTimeout: 20000,//120000,
    acquireTimeout: 20000,//120000,
    connectionLimit: 3, //200,
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
