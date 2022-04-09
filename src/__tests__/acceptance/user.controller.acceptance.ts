import { Client, expect } from '@loopback/testlab';
import { CasperMetricsApplication } from '../..';
import { setupApplication } from './test-helper';

describe( 'UserController', () => {
	let app: CasperMetricsApplication;
	let client: Client;

	before( 'setupApplication', async () => {
		( { app, client } = await setupApplication() );
	} );

	after( async () => {
		await app.stop();
	} );

	it( 'allows access to login without a JWT token and returns a correct error for invalid input', async () => {
		const res = await client.post( '/login' ).send({} ).expect( 401 );
	} );

	it( 'allows GET activate without a JWT token and returns a correct error for invalid input', async () => {
		const res = await client.get( '/activate?token=invalid' ).expect( 404 );
	} );

	it( 'forbids unauthorized POST invite', async () => {
		const res = await client.post( '/invite' ).expect( 401 );
	} );

	it( 'forbids unauthorized POST invite', async () => {
		const res = await client.post( '/invite' ).expect( 401 );
	} );

	it( 'forbids unauthorized GET me', async () => {
		const res = await client.get( '/me' ).expect( 401 );
	} );

	it( 'forbids unauthorized GET users', async () => {
		const res = await client.get( '/users' ).expect( 401 );
	} );

	it( 'forbids unauthorized POST user role', async () => {
		const res = await client.post( '/users/1/role/administrator' ).expect( 401 );
	} );

	it( 'forbids unauthorized POST user reset', async () => {
		const res = await client.post( '/users/1/reset' ).expect( 401 );
	} );

	it( 'forbids unauthorized POST user deactivate', async () => {
		const res = await client.post( '/users/1/deactivate' ).expect( 401 );
	} );

	it( 'allows POST user activate without JWT but returns a correct error for invalid data ', async () => {
		const res = await client.post( '/activate' ).send( {} ).expect( 404 );
	} );

	it( 'returns 2fa secret code for given email without JWT', async () => {
		const res = await client.get( '/generate2fa?email=123@test.com' ).expect( 200 );
		expect( JSON.parse( res.text ).secret ).to.String();
		expect( JSON.parse( res.text ).uri ).to.String();
	} );

	it( 'allows to verify 2FA without JWT and returns false if it is wrong', async () => {
		const res = await client.get( '/verify2fa?secret=invalid&token=invalid' ).expect( 200 );
		expect( res.text ).equal( 'false' );
	} );

	it( 'returns a correct error when login credentials are incorrect', async () => {
		const res = await client.post( '/login' ).send( {
			email: '123@test.com',
			password: 'incorrect',
			faCode: '123123'
		} ).expect( 404 );
		expect( JSON.parse( res.text ).error.message ).equal( 'User not found' );
	} );

} );
