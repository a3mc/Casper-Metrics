import { Filter } from '@loopback/repository';
import { Client, expect } from '@loopback/testlab';
import { CasperMetricsApplication } from '../..';
import { logger } from '../../logger';
import { Era } from '../../models';
import { givenTestDatabase, setupApplication } from './test-helper';

describe( 'EraController', () => {
	let app: CasperMetricsApplication;
	let client: Client;
	logger.silent = true;

	before( 'setupApplication', async () => {
		( { app, client } = await setupApplication() );
	} );
	before( givenTestDatabase );

	after( async () => {
		await app.stop();
	} );

	it( 'invokes GET era/circulating', async () => {
		const res = await client.get( '/era/circulating' ).expect( 200 );
		expect( parseInt( res.text ) ).to.Number();
	} );

	it( 'invokes GET era/circulating with era id', async () => {
		const res = await client.get( '/era/circulating?eraId=100' ).expect( 200 );
	} );

	it( 'should return 404 on non-existing era when querying circulating', async () => {
		const res = await client.get( '/era/circulating?eraId=10000000000' ).expect( 404 );
	} );

	it( 'invokes GET era/total', async () => {
		const res = await client.get( '/era/total' ).expect( 200 );
	} );

	it( 'invokes GET era/total with era id', async () => {
		const res = await client.get( '/era/total?eraId=100' ).expect( 200 );
	} );

	it( 'should return 404 on non-existing era when querying total', async () => {
		const res = await client.get( '/era/total?eraId=10000000000' ).expect( 404 );
	} );

	it( 'invokes GET era', async () => {
		const res = await client.get( '/era' ).expect( 200 );
		expect( res.body[0].id ).to.Number();
		expect( res.body[0].startBlock ).to.Number();
		expect( res.body[0].transfersCount ).to.Number();
		expect( res.body[0].deploysCount ).to.Number();
		expect( res.body[0].start ).to.String();
		expect( res.body[0].circulatingSupply ).to.Number();
		expect( res.body[0].validatorsWeights ).to.Number();
		expect( res.body[0].totalSupply ).to.Number();
		expect( res.body[0].validatorsRewards ).to.Number();
		expect( res.body[0].delegatorsRewards ).to.Number();
		expect( res.body[0].rewards ).to.Number();
		expect( res.body[0].validatorsCount ).to.Number();
		expect( res.body[0].delegatorsCount ).to.Number();
		expect( res.body[0].stakedThisEra ).to.Number();
		expect( res.body[0].undelegatedThisEra ).to.Number();
		expect( res.body[0].stakedDiffThisEra ).to.Number();
	} );

	it( 'invokes GET era with era id', async () => {
		const res = await client.get( '/era?id=100' ).expect( 200 );
		expect( res.body[0].id ).to.Number();
		expect( res.body[0].startBlock ).to.Number();
		expect( res.body[0].transfersCount ).to.Number();
		expect( res.body[0].deploysCount ).to.Number();
		expect( res.body[0].start ).to.String();
		expect( res.body[0].circulatingSupply ).to.Number();
		expect( res.body[0].validatorsWeights ).to.Number();
		expect( res.body[0].totalSupply ).to.Number();
		expect( res.body[0].validatorsRewards ).to.Number();
		expect( res.body[0].delegatorsRewards ).to.Number();
		expect( res.body[0].rewards ).to.Number();
		expect( res.body[0].validatorsCount ).to.Number();
		expect( res.body[0].delegatorsCount ).to.Number();
		expect( res.body[0].stakedThisEra ).to.Number();
		expect( res.body[0].undelegatedThisEra ).to.Number();
		expect( res.body[0].stakedDiffThisEra ).to.Number();
	} );

	it( 'should return empty array on non-existing era id when querying era objects', async () => {
		const res = await client.get( '/era?id=10000000000' ).expect( 200 );
		expect( res.body ).empty();
	} );

	it( 'invokes GET era by block height', async () => {
		const res = await client.get( '/era?blockHeight=100' ).expect( 200 );
		expect( res.body ).not.empty();
	} );

	it( 'should return empty array on non-existing block height', async () => {
		// Very high block will still return the last era as it's not closed yet.
		const res = await client.get( '/era?blockHeight=-1' ).expect( 200 );
		expect( res.body ).empty();
	} );

	it( 'should accept correct timestamp', async () => {
		const res = await client.get( '/era?timestamp=2021-04-01T09%3A03%3A06.000Z' ).expect( 200 );
	} );

	it( 'should not accept incorrect timestamp', async () => {
		const res = await client.get( '/era?timestamp=INVALID123' ).expect( 400 );
	} );

	it( 'should return last 5 eras, sorted by id desc', async () => {
		const res = await client.get( '/era?limit=5&order=id%20DESC' ).expect( 200 );
		expect( res.body.length ).to.equal( 5 );
		expect( res.body[0].id > res.body[1].id ).to.true();
		expect( res.body[1].id > res.body[2].id ).to.true();
		expect( res.body[2].id > res.body[3].id ).to.true();
		expect( res.body[3].id > res.body[4].id ).to.true();
	} );

	it( 'should return first 3 eras, sorted by id asc', async () => {
		const res = await client.get( '/era?limit=3&order=id%20ASC' ).expect( 200 );
		expect( res.body.length ).to.equal( 3 );
		expect( res.body[0].id < res.body[1].id ).to.true();
		expect( res.body[1].id < res.body[2].id ).to.true();
	} );

	it( 'invokes GET era with a custom filter for a complex query', async () => {
		const filter: Filter<Era> = {
			'where':
				{
					'deploysCount': 0,
					'and': [
						{ 'startBlock': { 'gte': 1000 } },
						{ 'startBlock': { 'lte': 1500 } },
					],
				},
			'fields': ['id', 'startBlock', 'start', 'end'],
		};

		const res = await client.get( '/era?filter=' + encodeURIComponent( JSON.stringify( filter ) ) ).expect( 200 );
		expect( res.body.length ).equal( 6 );
		expect( res.body[0].id ).to.Number();
		expect( res.body[0].startBlock ).to.Number();
		expect( res.body[0].start ).to.String();
		expect( res.body[0].end ).to.String();

		// Shouldn't return the fields that were not specified when "fields" is used.
		expect( res.body[0].deploysCount ).undefined();
		expect( res.body[0].endBlock ).undefined();
		expect( res.body[0].circulatingSupply ).undefined();
		expect( res.body[0].validatorsCirculatingSupply ).undefined();
		expect( res.body[0].transfersCirculatingSupply ).undefined();
		expect( res.body[0].rewardsCirculatingSupply ).undefined();
		expect( res.body[0].validatorsWeights ).undefined();
		expect( res.body[0].totalSupply ).undefined();
		expect( res.body[0].validatorsRewards ).undefined();
		expect( res.body[0].delegatorsRewards ).undefined();
		expect( res.body[0].rewards ).undefined();
		expect( res.body[0].delegatorsCount ).undefined();
		expect( res.body[0].validatorsCount ).undefined();
		expect( res.body[0].stakedThisEra ).undefined();
		expect( res.body[0].undelegatedThisEra ).undefined();
		expect( res.body[0].stakedDiffThisEra ).undefined();
	} );

	it( 'fails to GET era with a wrong custom filter syntax', async () => {
		const res = await client.get( '/era?filter=' + encodeURIComponent( 'something wrong' ) ).expect( 400 );
	} );

} );
