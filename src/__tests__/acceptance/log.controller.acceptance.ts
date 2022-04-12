import { Client, expect } from '@loopback/testlab';
import { CasperMetricsApplication } from '../..';
import { UserRepository } from '../../repositories';
import { testdb } from './metrics-db.datasource';
import { givenTestDatabase, setupApplication } from './test-helper';

const twofactor = require( 'node-2fa' );

describe( 'AdminLogsController', () => {
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

	it( 'forbids unauthorized GET logs', async () => {
		const res = await client.get( '/admin-logs' ).expect( 401 );
	} );

	it( 'forbids unauthorized GET log by id', async () => {
		const res = await client.get( '/admin-logs/1' ).expect( 401 );
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

		it( 'can access admin logs list', async () => {
			const res = await client.get( '/admin-logs' ).auth( jwtToken, { type: 'bearer' } ).expect( 200 );
		} );

		it( 'can access admin logs by id', async () => {
			const res = await client.get( '/admin-logs/1' ).auth( jwtToken, { type: 'bearer' } ).expect( 404 );
		} );

	} );
} );
