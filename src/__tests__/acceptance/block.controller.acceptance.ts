import { Filter } from '@loopback/repository';
import { Client, expect } from '@loopback/testlab';
import { CasperMetricsApplication } from '../..';
import { logger } from '../../logger';
import { Block } from '../../models';
import { BlockRepository } from '../../repositories';
import { testdb } from './metrics-db.datasource';
import { givenTestDatabase, setupApplication } from './test-helper';

describe( 'BlockController', () => {
	let app: CasperMetricsApplication;
	let client: Client;
	let blockRepository = new BlockRepository( testdb );
	logger.silent = true;

	before( 'setupApplication', async () => {
		( { app, client } = await setupApplication() );
	} );
	before( givenTestDatabase );

	after( async () => {
		await app.stop();
	} );

	it( 'invokes GET block/circulating', async () => {
		const res = await client.get( '/block/circulating' ).expect( 200 );
	} );

	it( 'invokes GET block/circulating with block id', async () => {
		const res = await client.get( '/block/circulating?blockHeight=1000' ).expect( 200 );
		expect( parseInt( res.text ) ).to.Number();
	} );

	it( 'should return 404 on non-existing block when querying circulating', async () => {
		const res = await client.get( '/block/circulating?blockHeight=10000000000' ).expect( 404 );
	} );

	it( 'invokes GET block/total', async () => {
		const res = await client.get( '/block/total' ).expect( 200 );
		expect( parseInt( res.text ) ).to.Number();
	} );

	it( 'invokes GET block/total with block height', async () => {
		const res = await client.get( '/block/total?blockHeight=1000' ).expect( 200 );
		expect( parseInt( res.text ) ).to.Number();
	} );

	it( 'should return 404 on non-existing block when querying total', async () => {
		const res = await client.get( '/block/circulating?blockHeight=10000000000' ).expect( 404 );
	} );

	it( 'invokes GET block without params - last', async () => {
		const res = await client.get( '/block' ).expect( 200 );
		expect( res.body[0].blockHeight ).to.Number();
		expect( res.body[0].blockHash ).to.String();
		expect( res.body[0].transfersCount ).to.Number();
		expect( res.body[0].deploysCount ).to.Number();
		expect( res.body[0].circulatingSupply ).to.Number();
		expect( res.body[0].validatorsWeights ).to.Number();
		expect( res.body[0].totalSupply ).to.Number();
		expect( res.body[0].validatorsRewards ).to.Number();
		expect( res.body[0].delegatorsRewards ).to.Number();
		expect( res.body[0].rewards ).to.Number();
		expect( res.body[0].validatorsCount ).to.Number();
		expect( res.body[0].delegatorsCount ).to.Number();
	} );

	it( 'invokes GET block with block height', async () => {
		const res = await client.get( '/block?blockHeight=1000' ).expect( 200 );
		expect( res.body[0].blockHeight ).to.Number();
		expect( res.body[0].blockHash ).to.String();
		expect( res.body[0].transfersCount ).to.Number();
		expect( res.body[0].deploysCount ).to.Number();
		expect( res.body[0].circulatingSupply ).to.Number();
		expect( res.body[0].validatorsWeights ).to.Number();
		expect( res.body[0].totalSupply ).to.Number();
		expect( res.body[0].validatorsRewards ).to.Number();
		expect( res.body[0].delegatorsRewards ).to.Number();
		expect( res.body[0].rewards ).to.Number();
		expect( res.body[0].validatorsCount ).to.Number();
		expect( res.body[0].delegatorsCount ).to.Number();
	} );

	it( 'invokes GET block with block hash', async () => {
		const blockHash = ( await blockRepository.find( {
			limit: 1,
			order: ['blockHeight DESC'],
		} ) )[0].blockHash;

		const res = await client.get( '/block?hash=' + blockHash ).expect( 200 );
		expect( res.body[0].blockHash ).equal( blockHash );
	} );

	it( 'should return 404 when querying non-existing block with height', async () => {
		const res = await client.get( '/block?blockHeight=10000000000' ).expect( 404 );
	} );

	it( 'should return 404 when querying non-existing block with hash', async () => {
		const res = await client.get( '/block?hash=no_such_hash' ).expect( 404 );
	} );

	it( 'invokes GET block with a custom filter for a complex query', async () => {
		const filter: Filter<Block> = {
			'where': {
				'and': [
					{ 'blockHeight': { 'gte': 3000 } },
					{ 'blockHeight': { 'lt': 4000 } },
				],
				'switch': false,
			},
			'fields': ['blockHash', 'totalSupply', 'circulatingSupply'],
			'order': ['blockHeight ASC'],
			'limit': 2,
		};

		const res = await client.get( '/block?filter=' + encodeURIComponent( JSON.stringify( filter ) ) ).expect( 200 );
		expect( res.body.length ).equal( 2 );
		expect( res.body[0].blockHash ).to.String();
		expect( res.body[0].totalSupply ).equal( 0 );
		expect( res.body[0].circulatingSupply ).equal( 0 );

		// Shouldn't return the fields that were not specified when "fields" is used.
		expect( res.body[0].blockHeight ).undefined();
		expect( res.body[0].eraId ).undefined();
		expect( res.body[0].validatorsWeights ).undefined();
		expect( res.body[0].stateRootHash ).undefined();
		expect( res.body[0].deploysCount ).undefined();
		expect( res.body[0].stakedThisBlock ).undefined();
		expect( res.body[0].nextEraValidatorsWeights ).undefined();
		expect( res.body[0].switch ).undefined();
		expect( res.body[0].validatorsRewards ).undefined();
		expect( res.body[0].delegatorsRewards ).undefined();
		expect( res.body[0].rewards ).undefined();
		expect( res.body[0].delegatorsCount ).undefined();
		expect( res.body[0].validatorsCount ).undefined();
		expect( res.body[0].undelegatedThisBlock ).undefined();
		expect( res.body[0].timestamp ).undefined();
	} );

	it( 'fails to GET block with a wrong custom filter syntax', async () => {
		const res = await client.get( '/block?filter=' + encodeURIComponent( 'something wrong' ) ).expect( 400 );
	} );
} );
