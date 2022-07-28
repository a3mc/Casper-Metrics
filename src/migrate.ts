// This is a default Loopback file that helps to run the migrations.
// It's all done under-the-hood there automatically, based on the Models.
// Please see the /models folder and Loopback 4 docs for more details.

import { CasperMetricsApplication } from './application';

// It supports args to specify the way migration should proceed.
// By default it just alters the databases, while preserving the data.
// If --rebuild was passed the whole database is cleared.
export async function migrate( args: string[] ) {
	const existingSchema = args.includes( '--rebuild' ) ? 'drop' : 'alter';
	console.log( 'Migrating schemas (%s existing schema)', existingSchema );

	const app = new CasperMetricsApplication();
	await app.boot();
	await app.migrateSchema( { existingSchema } );

	// Connectors usually keep a pool of opened connections,
	// this keeps the process running even after all work is done.
	// We need to exit explicitly.
	process.exit( 0 );
}

migrate( process.argv ).catch( err => {
	console.error( 'Cannot migrate database schema', err );
	process.exit( 1 );
} );
