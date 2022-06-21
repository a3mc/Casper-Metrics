import { Client, expect } from '@loopback/testlab';
import { CasperMetricsApplication } from '../..';
import { logger } from '../../logger';
import { setupApplication } from './test-helper';

describe( 'PriceController', () => {
	let app: CasperMetricsApplication;
	let client: Client;
	logger.silent = true;

	before( 'setupApplication', async () => {
		( { app, client } = await setupApplication() );
	} );

	after( async () => {
		await app.stop();
	} );

	it( 'invokes GET price and return the last price from external service', async () => {
		const res = await client.get( '/price' ).expect( 200 );
		expect( parseFloat( res.text ) ).to.Number();
		expect( parseFloat( res.text ) ).greaterThan( 0 );
	} );

	it( 'invokes GET prices', async () => {
		const res = await client.get( '/prices' ).expect( 200 );
	} );

	it( 'expects GET prices to be a valid array of data', async () => {
		const res = await client.get( '/prices' ).expect( 200 );
		const prices = JSON.parse( res.text );
		expect( typeof prices ).equal( 'object' );
		expect( prices.length ).greaterThan( 0 );
		expect( prices[0].id ).to.Number();
		expect( prices[0].open ).to.Number();
		expect( prices[0].close ).to.Number();
		expect( prices[0].high ).to.Number();
		expect( prices[0].low ).to.Number();
		expect( prices[0].volumeFrom ).to.Number();
		expect( prices[0].volumeTo ).to.Number();
		expect( prices[0].date ).to.String();
	} );
} );
