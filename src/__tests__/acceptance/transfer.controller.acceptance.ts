import { Client, expect } from '@loopback/testlab';
import { CasperMetricsApplication } from '../..';
import { setupApplication } from './test-helper';

describe( 'TransferController', () => {
	let app: CasperMetricsApplication;
	let client: Client;

	before( 'setupApplication', async () => {
		( { app, client } = await setupApplication() );
	} );

	after( async () => {
		await app.stop();
	} );

	it( 'invokes GET transfersByEraId', async () => {
		const res = await client.get( '/transfersByEraId' ).expect( 200 );
	} );

	it( 'forbids unauthorized GET transfers', async () => {
		const res = await client.get( '/transfers' ).expect( 401 );
	} );

	it( 'forbids unauthorized GET transfers_tree', async () => {
		const res = await client.get( '/transfers_tree' ).expect( 401 );
	} );

	it( 'forbids unauthorized GET transfers/status', async () => {
		const res = await client.get( '/transfers/status' ).expect( 401 );
	} );

	it( 'forbids unauthorized POST transfers/approve', async () => {
		const res = await client.post( '/transfers/approve' ).expect( 401 );
	} );

	it( 'forbids unauthorized POST transfers/calculate', async () => {
		const res = await client.post( '/transfers/calculate' ).expect( 401 );
	} );

	it( 'expects correct data by GET transfersByEraId', async () => {
		const res = await client.get( '/transfersByEraId?limit=5&eraId=1000' ).expect( 200 );
		const transfers = JSON.parse( res.text );
		expect( transfers.transfers.length ).equal( 5 );
		expect( transfers.count ).equal( 28 );
		expect( transfers.eraId ).equal( 1000 );
		expect( transfers.eraStart ).to.String();
		expect( transfers.eraEnd ).to.String();
		expect( transfers.transfers[0].id ).equal( 42536 );
		expect( transfers.transfers[0].depth ).equal( 0 );
		expect( transfers.transfers[0].blockHeight ).equal( 108232 );
		expect( transfers.transfers[0].eraId ).equal( 1000 );
		expect( transfers.transfers[0].deployHash ).to.String();
		expect( transfers.transfers[0].from ).to.String();
		expect( transfers.transfers[0].fromHash ).to.String();
		expect( transfers.transfers[0].to ).to.String();
		expect( transfers.transfers[0].toHash ).to.String();
		expect( transfers.transfers[0].amount ).to.String();
		expect( transfers.transfers[0].denomAmount).to.Number();
	} );

	it( 'expects should not return data for not-existing Era', async () => {
		const res = await client.get( '/transfersByEraId?eraId=10000000' ).expect( 404 );
		expect( JSON.parse( res.text ).error.message ).equal(
			'Entity not found: Era with id 10000000'
		);
	} );

	it( 'return one last Era id id is not specified', async () => {
		const res = await client.get( '/transfersByEraId' ).expect( 200 );
		expect( JSON.parse( res.text ).eraId ).greaterThan( 0 );
	} );

} );
