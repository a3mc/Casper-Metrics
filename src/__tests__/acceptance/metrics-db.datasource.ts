import { juggler } from '@loopback/repository';

// THis creates in-memory database to be used in tests.
export const testdb: juggler.DataSource = new juggler.DataSource( {
	name: 'metricsDB',
	connector: 'memory',
} );
