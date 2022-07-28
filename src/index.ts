// That is the main file that handles the process of starting the application.
// It provides common bootstrapping logic used in Loopback apps.
import dotenv from 'dotenv';
import { ApplicationConfig, CasperMetricsApplication } from './application';
import { MetricsDbDataSource } from './datasources';
import { logger } from './logger';
import { ProcessingRepository } from './repositories';

export * from './application';
dotenv.config();

// It accepts the passed app's options and initialises it.
export async function main( options: ApplicationConfig = {} ) {
	const app = new CasperMetricsApplication( options );
	await app.boot();
	await app.exportOpenApiSpec( './dist/openapi.json' );
	await app.start();

	const url = app.restServer.url;
	logger.info( `Public API Server is running at ${ url }` );

	// Reset the "updating" status flag if it was set.
	const dataSource = new MetricsDbDataSource();
	const processingRepository = new ProcessingRepository( dataSource );
	const status = await processingRepository.findOne( {
		where: {
			type: 'updating'
		}
	} );
	if ( status ) {
		status.value = 0;
		await processingRepository.update( status );
	}

	return app;
}

if ( require.main === module ) {
	// Run the application
	// Provided settings are for needed for properly launching the REST API.
	if ( process.env.PUBLIC_API_PORT ) {
		const config = {
			shutdown: {
				gracePeriod: 5000,
			},
			rest: {
				port: process.env.PUBLIC_API_PORT,
				host: process.env.HOST,
				gracePeriodForClose: 5000, // 5 seconds
				openApiSpec: {
					// useful when used with OpenAPI-to-GraphQL to locate your application
					setServersFromRequest: false,
					disabled: true,
				},
				expressSettings: {
					'x-powered-by': false,
					env: 'production',
				},
				basePath: '/',
				cors: {
					// As it's a public API we enable cross-origin requests from everywhere.
					origin: '*',
					// These the only methods used, so we limit the methods to them.
					methods: 'OPTIONS,GET,HEAD,POST',
					preflightContinue: false,
					optionsSuccessStatus: 204,
					// Credentials can be used for some endpoints in the admin part.
					credentials: true,
				},
			},
		};
		main( config ).catch( err => {
			console.error( 'Cannot start the application.', err );
			process.exit( 1 );
		} );
	}

}
