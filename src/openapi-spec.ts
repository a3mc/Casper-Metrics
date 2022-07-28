// When building the project, we can extract the OpenAPI spec so it han be hosted individually.

import { ApplicationConfig } from '@loopback/core';
import { CasperMetricsApplication } from './application';

/**
 * Export the OpenAPI spec from the application
 */
async function exportOpenApiSpec(): Promise<void> {
	const config: ApplicationConfig = {
		rest: {
			port: +( process.env.PORT ?? 3000 ),
			host: process.env.HOST ?? 'localhost',
		},
	};
	// Once we get the output file path, we use built-in Loopback's ability to export the specification.
	const outFile = process.argv[2] ?? '';
	const app = new CasperMetricsApplication( config );
	await app.boot();
	await app.exportOpenApiSpec( outFile );
}

exportOpenApiSpec().catch( err => {
	console.error( 'Fail to export OpenAPI spec from the application.', err );
	process.exit( 1 );
} );
