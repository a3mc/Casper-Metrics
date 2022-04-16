import { Client, expect } from '@loopback/testlab';
import { CasperMetricsApplication } from '../..';
import { UserRepository } from '../../repositories';
import { testdb } from './metrics-db.datasource';
import { givenTestDatabase, setupApplication } from './test-helper';

const twofactor = require( 'node-2fa' );

describe( 'ValidatorsUnlockController', () => {
	let app: CasperMetricsApplication;
	let client: Client;
	let userRepository = new UserRepository( testdb );

	before( 'setupApplication', async () => {
		( { app, client } = await setupApplication() );
	} );
	before( givenTestDatabase );

	after( async () => {
		await app.stop();
	} );

	it( 'forbids unauthorized GET unlocks', async () => {
		const res = await client.get( '/validators-unlock' ).expect( 401 );
	} );

	it( 'forbids unauthorized POST unlocks', async () => {
		const res = await client.post( '/validators-unlock' ).expect( 401 );
	} );

	describe( 'Logged in as Viewer', async () => {
		let jwtToken = '';
		before( 'setupApplication', async () => {
			const user: any = await userRepository.findOne( {
				where: { email: 'viewer@localhost' },
			} );

			const res = await client.post( '/login' ).send( {
				email: user.email,
				password: 'testpassword',
				faCode: twofactor.generateToken( user.faSecret ).token,
			} ).expect( 200 );

			jwtToken = JSON.parse( res.text ).token;
		} );

		it( 'can access GET unlocks', async () => {
			const res = await client.get( '/validators-unlock' )
				.auth( jwtToken, { type: 'bearer' } ).expect( 200 );
		} );

		it( 'forbids unauthorized POST unlocks', async () => {
			const res = await client.post( '/validators-unlock' )
				.send( {
					unlock90: 123,
					custom :[{
						amount: 555,
						date: '2022-04-15T16:24:02Z'
					}],
				} )
				.auth( jwtToken, { type: 'bearer' } ).expect( 403 );
		} );

	} );

	describe( 'Logged in as Editor', async () => {
		let jwtToken = '';
		before( 'setupApplication', async () => {
			const user: any = await userRepository.findOne( {
				where: { email: 'editor@localhost' },
			} );

			const res = await client.post( '/login' ).send( {
				email: user.email,
				password: 'testpassword',
				faCode: twofactor.generateToken( user.faSecret ).token,
			} ).expect( 200 );

			jwtToken = JSON.parse( res.text ).token;
		} );

		it( 'can access GET unlocks', async () => {
			const res = await client.get( '/validators-unlock' )
				.auth( jwtToken, { type: 'bearer' } ).expect( 200 );
		} );

		it( 'can update unlocks', async () => {
			const res = await client.post( '/validators-unlock' ).send( {
				unlock90: 123,
				custom :[{
					amount: 555,
					date: '2022-04-15T16:24:02Z'
				}],
			} )
				.auth( jwtToken, { type: 'bearer' } ).expect( 204 );
		} );

		it( 'throws an error if data is incorrect', async () => {
			const res = await client.post( '/validators-unlock' )
				.send( {
					incorrect: 123
				} )
				.auth( jwtToken, { type: 'bearer' } ).expect( 400 );
		} );

	} );
} );
