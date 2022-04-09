import { Client, expect } from '@loopback/testlab';
import { CasperMetricsApplication } from '../..';
import { setupApplication } from './test-helper';

describe( 'HealthController', () => {
	let app: CasperMetricsApplication;
	let client: Client;

	before( 'setupApplication', async () => {
		( { app, client } = await setupApplication() );
	} );

	after( async () => {
		await app.stop();
	} );

	it( 'invokes GET health', async () => {
		const res = await client.get( '/health' ).expect( 200 );
		expect( res.text ).equal( 'I\'m fine!' );
	} );
} );
