import { inject, lifeCycleObserver, LifeCycleObserver } from '@loopback/core';
import { juggler } from '@loopback/repository';
import dotenv from 'dotenv';

dotenv.config();

// Database connection configuration. Most of the values are take from the .env file.
const config = {
	name: 'metricsDB',
	connector: 'mysql',
	url: '',
	host: process.env.MYSQL_HOST,
	port: process.env.MYSQL_PORT,
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD,
	database: process.env.DATABASE,
	supportBigNumbers: true,
	connectTimeout: 120000,
	acquireTimeout: 120000,
	connectionLimit: process.env.MYSQL_CONNECTION_LIMIT,
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
