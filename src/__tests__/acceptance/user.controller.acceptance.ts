import { Client, expect } from '@loopback/testlab';
import { CasperMetricsApplication } from '../..';
import { logger } from '../../logger';
import { UserRepository } from '../../repositories';
import { testdb } from './metrics-db.datasource';
import { givenTestDatabase, setupApplication } from './test-helper';

const twofactor = require( 'node-2fa' );

describe( 'UserController', () => {
	let app: CasperMetricsApplication;
	let client: Client;
	let userRepository = new UserRepository( testdb );
	logger.silent = true;

	before( 'setupApplication', async () => {
		( { app, client } = await setupApplication() );
	} );
	before( givenTestDatabase );

	after( async () => {
		await app.stop();
	} );

	it( 'allows access to login without a JWT token and returns a correct error for invalid input', async () => {
		const res = await client.post( '/login' ).send( {} ).expect( 401 );
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
			faCode: '123123',
		} ).expect( 404 );
		expect( JSON.parse( res.text ).error.message ).equal( 'User not found' );
	} );

	it( 'doesn\'t allow to login without 2FA', async () => {
		const res = await client.post( '/login' ).send( {
			email: 'admin@localhost',
			password: 'testpassword',
		} ).expect( 401 );
		expect( JSON.parse( res.text ).error.message ).equal( 'No 2FA code provided' );
	} );

	it( 'doesn\'t allow to login with invalid 2FA code', async () => {
		const res = await client.post( '/login' ).send( {
			email: 'admin@localhost',
			password: 'testpassword',
			faCode: 123123123,
		} ).expect( 401 );
		expect( JSON.parse( res.text ).error.message ).equal( '2FA code is not valid' );
	} );

	it( 'doesn\'t allow to login with not registered email', async () => {
		const res = await client.post( '/login' ).send( {
			email: 'nosuchemail@localhost',
			password: 'testpassword',
			faCode: 123123123,
		} ).expect( 404 );
		expect( JSON.parse( res.text ).error.message ).equal( 'User not found' );
	} );

	it( 'doesn\'t allow to login with invalid password', async () => {
		const res = await client.post( '/login' ).send( {
			email: 'admin@localhost',
			password: 'wrongpassword',
			faCode: 123123123,
		} ).expect( 401 );
		expect( JSON.parse( res.text ).error.message ).equal( 'Password is not valid' );
	} );

	it( 'allows to login with valid credentials and returns profile with JWT token', async () => {
		const user: any = await userRepository.findOne( {
			where: { email: 'admin@localhost' },
		} );

		const res = await client.post( '/login' ).send( {
			email: user.email,
			password: 'testpassword',
			faCode: twofactor.generateToken( user.faSecret ).token,
		} ).expect( 200 );

		const profile = JSON.parse( res.text );
		expect( profile.id ).to.Number();
		expect( profile.email ).equal( user.email );
		expect( profile.firstName ).equal( user.firstName );
		expect( profile.lastName ).equal( user.lastName );
		expect( profile.role ).equal( user.role );
		expect( profile.token ).to.String();
	} );

	it( 'doesn\'t allows to login if user is not active', async () => {
		const user: any = await userRepository.findOne( {
			where: { email: 'notactive@localhost' },
		} );

		const res = await client.post( '/login' ).send( {
			email: user.email,
			password: 'testpassword',
			faCode: twofactor.generateToken( user.faSecret ).token,
		} ).expect( 404 );
	} );

	it( 'doesn\'t allows to login if user was deleted', async () => {
		const user: any = await userRepository.findOne( {
			where: { email: 'deleted@localhost' },
		} );

		const res = await client.post( '/login' ).send( {
			email: user.email,
			password: 'testpassword',
			faCode: twofactor.generateToken( user.faSecret ).token,
		} ).expect( 404 );
	} );

	describe( 'Logged in as Admin', async () => {
		let jwtToken = '';
		before( 'setupApplication', async () => {
			const user: any = await userRepository.findOne( {
				where: { email: 'admin@localhost' },
			} );

			const res = await client.post( '/login' ).send( {
				email: user.email,
				password: 'testpassword',
				faCode: twofactor.generateToken( user.faSecret ).token,
			} ).expect( 200 );

			jwtToken = JSON.parse( res.text ).token;
		} );

		it( 'can access "me" endpoint and get the profile', async () => {
			const res = await client.get( '/me' ).auth( jwtToken, { type: 'bearer' } ).expect( 200 );
			const profile = JSON.parse( res.text );
			expect( profile.id ).to.Number();
			expect( profile.email ).equal( 'admin@localhost' );
			expect( profile.firstName ).equal( 'Admin' );
			expect( profile.lastName ).equal( 'Admin' );
			expect( profile.role ).equal( 'administrator' );
		} );

		it( 'can access users list', async () => {
			const res = await client.get( '/users' ).auth( jwtToken, { type: 'bearer' } ).expect( 200 );
			const users = JSON.parse( res.text );
			expect( users.length ).greaterThan( 0 );
		} );

		it( 'can invite another user', async () => {
			const res = await client.post( '/invite' )
				.auth( jwtToken, { type: 'bearer' } )
				.send( {
					email: 'newuser@localhost',
					firstName: 'New',
					lastName: 'User',
				} )
				.expect( 204 );

			const user: any = await userRepository.findOne( {
				where: { email: 'newuser@localhost' },
			} );

			expect( user.active ).false();
		} );

		it( 'can\'t invite an existing user', async () => {
			const res = await client.post( '/invite' )
				.auth( jwtToken, { type: 'bearer' } )
				.send( {
					email: 'deleted@localhost',
					firstName: 'Deleted',
					lastName: 'Permanently',
				} )
				.expect( 405 );
		} );

		it( 'can change other user\'s role', async () => {
			let user: any = await userRepository.findOne( {
				where: { email: 'viewer@localhost' },
			} );

			expect( user.role ).equal( 'viewer' );

			const changeRoleRes = await client.post( '/users/' + user.id + '/role/editor' )
				.auth( jwtToken, { type: 'bearer' } )
				.expect( 204 );

			user = await userRepository.findOne( {
				where: { email: 'viewer@localhost' },
			} );

			expect( user.role ).equal( 'editor' );
		} );

		it( 'can reset another user', async () => {
			let user: any = await userRepository.findOne( {
				where: { email: 'viewer@localhost' },
			} );

			expect( user.active ).true();

			const resetRes = await client.post( '/users/' + user.id + '/reset' )
				.auth( jwtToken, { type: 'bearer' } )
				.expect( 204 );

			user = await userRepository.findOne( {
				where: { email: 'viewer@localhost' },
			} );

			expect( user.active ).false();
		} );

		it( 'can deactivate another user', async () => {
			let user: any = await userRepository.findOne( {
				where: { email: 'viewer@localhost' },
			} );

			expect( user.deleted ).false();

			const resetRes = await client.post( '/users/' + user.id + '/deactivate' )
				.auth( jwtToken, { type: 'bearer' } )
				.expect( 204 );

			user = await userRepository.findOne( {
				where: { email: 'viewer@localhost' },
			} );

			expect( user.deleted ).true();
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

		it( 'can\'t get the list of users', async () => {
			const res = await client.get( '/users' ).auth( jwtToken, { type: 'bearer' } )
				.expect( 403 );
		} );

		it( 'can\'t invite another user', async () => {
			const res = await client.post( '/invite' )
				.auth( jwtToken, { type: 'bearer' } )
				.send( {
					email: 'newuser@localhost',
					firstName: 'New',
					lastName: 'User',
				} )
				.expect( 403 );
		} );

		it( 'can\'t change other user\'s role', async () => {
			let user: any = await userRepository.findOne( {
				where: { email: 'viewer@localhost' },
			} );

			const changeRoleRes = await client.post( '/users/' + user.id + '/role/editor' )
				.auth( jwtToken, { type: 'bearer' } )
				.expect( 403 );
		} );

		it( 'can\'t reset another user', async () => {
			let user: any = await userRepository.findOne( {
				where: { email: 'viewer@localhost' },
			} );

			const resetRes = await client.post( '/users/' + user.id + '/reset' )
				.auth( jwtToken, { type: 'bearer' } )
				.expect( 403 );
		} );

		it( 'can\'t deactivate another user', async () => {
			let user: any = await userRepository.findOne( {
				where: { email: 'viewer@localhost' },
			} );

			const resetRes = await client.post( '/users/' + user.id + '/deactivate' )
				.auth( jwtToken, { type: 'bearer' } )
				.expect( 403 );
		} );

	} );

	describe( 'Logged in as Viewer', async () => {
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

		it( 'can\'t get the list of users', async () => {
			const res = await client.get( '/users' ).auth( jwtToken, { type: 'bearer' } )
				.expect( 403 );
		} );

		it( 'can\'t invite another user', async () => {
			const res = await client.post( '/invite' )
				.auth( jwtToken, { type: 'bearer' } )
				.send( {
					email: 'newuser@localhost',
					firstName: 'New',
					lastName: 'User',
				} )
				.expect( 403 );
		} );

		it( 'can\'t change other user\'s role', async () => {
			let user: any = await userRepository.findOne( {
				where: { email: 'viewer@localhost' },
			} );

			const changeRoleRes = await client.post( '/users/' + user.id + '/role/editor' )
				.auth( jwtToken, { type: 'bearer' } )
				.expect( 403 );
		} );

		it( 'can\'t reset another user', async () => {
			let user: any = await userRepository.findOne( {
				where: { email: 'viewer@localhost' },
			} );

			const resetRes = await client.post( '/users/' + user.id + '/reset' )
				.auth( jwtToken, { type: 'bearer' } )
				.expect( 403 );
		} );

		it( 'can\'t deactivate another user', async () => {
			let user: any = await userRepository.findOne( {
				where: { email: 'viewer@localhost' },
			} );

			const resetRes = await client.post( '/users/' + user.id + '/deactivate' )
				.auth( jwtToken, { type: 'bearer' } )
				.expect( 403 );
		} );

	} );

} );
