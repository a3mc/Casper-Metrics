import { Filter } from '@loopback/repository';
import { Client, expect } from '@loopback/testlab';
import { CasperMetricsApplication } from '../..';
import { logger } from '../../logger';
import { Era, Peers } from '../../models';
import { setupApplication } from './test-helper';

describe( 'GeodataController', () => {
	let app: CasperMetricsApplication;
	let client: Client;
	logger.silent = true;

	before( 'setupApplication', async () => {
		( { app, client } = await setupApplication() );
	} );

	after( async () => {
		await app.stop();
	} );

	it( 'invokes GET validators', async () => {
		const res = await client.get( '/validators' ).expect( 200 );
	} );

	it( 'returns a correct structure of validators', async () => {
		const res = await client.get( '/validators' );
		const validators = JSON.parse( res.text );
		expect( validators.length ).greaterThanOrEqual( 1 );
		expect( validators[0].region ).to.String();
		expect( validators[0].country ).to.String();
		expect( validators[0].loc ).to.String();
		expect( validators[0].org ).to.String();
		expect( validators[0].timezone ).to.String();
		expect( validators[0].api_version ).to.String();
		expect( validators[0].public_key ).to.String();
	} );

	it( 'invokes GET validators with a custom filter', async () => {
		const filter: Filter<Peers> = {
			'where':
				{
					city: 'Tokyo',
					country: 'JP'
				},
			'fields': ['city', 'country', 'performance'],
		};

		const res = await client.get( '/validators?filter=' + encodeURIComponent( JSON.stringify( filter ) ) ).expect( 200 );
	} );

	it( 'fails to return GET validators with incorrect filter query', async () => {
		const res = await client.get( '/validators?filter=something_wrong' ).expect( 400 );
	} );
} );
