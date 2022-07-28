import { authenticate, AuthenticationBindings } from '@loopback/authentication';
import { inject } from '@loopback/core';
import { repository } from '@loopback/repository';
import { get, oas, OperationVisibility, param, post, requestBody, response } from '@loopback/rest';
import { UserProfile } from '@loopback/security';
import * as crypto from 'crypto';
import moment from 'moment';
import * as nodemailer from 'nodemailer';
import { IncorrectData, NotAllowed, NotFound } from '../errors/errors';
import { AdminLogServiceBindings, PasswordHasherBindings, TokenServiceBindings, UserServiceBindings } from '../keys';
import { logger } from '../logger';
import { User } from '../models';
import { UserRepository } from '../repositories';
import { AdminLogService } from '../services';
import { BcryptHasher } from '../services/hash.password';
import { JWTService } from '../services/jwt.service';
import { MyUserService } from '../services/user.service';

// Admin-only REST API controller class for operations with Users, served by the Loopback framework.
@oas.visibility( OperationVisibility.UNDOCUMENTED )
export class UserController {
	// Requires a user repository and helper services for encryption and validations.
	constructor(
		@repository( UserRepository )
		public userRepository: UserRepository,
		@inject( PasswordHasherBindings.PASSWORD_HASHER )
		public hasher: BcryptHasher,
		@inject( UserServiceBindings.USER_SERVICE )
		public userService: MyUserService,
		@inject( TokenServiceBindings.TOKEN_SERVICE )
		public jwtService: JWTService,
		@inject( AdminLogServiceBindings.ADMINLOG_SERVICE )
		public adminLogService: AdminLogService,
	) {
	}

	// Endpoint for admin to invite another user to the admin system.
	@authenticate( { strategy: 'jwt', options: { required: ['administrator'] } } )
	@post( '/invite' )
	async invite( @requestBody() user: Partial<User> ): Promise<void> {
		if ( await this.userRepository.findOne( {
			where: {
				email: user.email,
			},
		} ) ) {
			throw new NotAllowed( 'User with this email already exists.' );
		}

		const token = crypto.randomBytes( 48 ).toString( 'hex' );

		// Create a not-activated user with a "viewer" status.

		await this.userRepository.create( {
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			active: false,
			deleted: false,
			invitedAt: moment().format(),
			inviteToken: token,
			role: 'viewer',
		} );

		// Send an email, but don't wait for result here, as it may take some time to be processed.
		this._sendActivationLink( user, token );
	}

	// Public endpoint for user with invitation link to join the admin panel.
	@get( '/activate' )
	async activate(
		@param.query.string( 'token' ) token: string,
	): Promise<any> {
		// Verify the provided details and if such user with the token exists and still not actvated.
		const user = await this.userRepository.findOne( {
			where: {
				active: false,
				deleted: false,
				inviteToken: token,
				invitedAt: {
					gt: moment().add( -24, 'hours' ).format(),
				},
			},
		} );

		if ( !user ) {
			throw new NotFound( 'User not found' );
		}

		return {
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
		};
	}

	// And endpoint to log in.
	@post( '/login' )
	async login(
		@requestBody() credentials: any,
	): Promise<any> {
		// First time admin login.
		if (
			process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL === credentials.email &&
			process.env.ADMIN_FIRST_NAME &&
			process.env.ADMIN_LAST_NAME &&
			process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD === credentials.password &&
			!( await this.userRepository.count() ).count
		) {
			logger.info( 'Creating invite link for the first admin:' + credentials.email );
			await this.invite( {
				firstName: process.env.ADMIN_FIRST_NAME,
				lastName: process.env.ADMIN_LAST_NAME,
				email: credentials.email,
				password: credentials.password,
			} );

			const adminUser = await this.userRepository.findOne( {
				where: { email: credentials.email },
			} );

			return { activate: adminUser?.inviteToken };
		}

		const user = await this.userService.verifyCredentials( credentials );
		const userProfile = await this.userService.convertToUserProfile( user );
		const token = await this.jwtService.generateToken( userProfile );
		userProfile.token = token;
		return userProfile;
	}

	// Endpoint to receive a user profile when sending a JWT token.
	@authenticate( { strategy: 'jwt' } )
	@get( '/me' )
	async me(
		@inject( AuthenticationBindings.CURRENT_USER ) currentUser: UserProfile,
	): Promise<Partial<User>> {
		const dbUser = await this.userRepository.findOne( {
			where: {
				id: currentUser.id,
				active: true,
				deleted: false,
			},
			fields: ['id', 'email', 'firstName', 'lastName', 'role'],
		} );
		if ( !dbUser ) {
			throw new NotAllowed( 'Not allowed' );
		}

		return Promise.resolve( dbUser );
	}

	// Endpoint to generate 2FA secret for a given email.
	@get( '/generate2fa' )
	async generate2fa(
		@param.query.string( 'email' ) email: string,
	): Promise<any> {
		return this.userService.generate2FASecret( email );
	}

	// Endpoint to validate the validity of 2FA code.
	@get( '/verify2fa' )
	async verify2fa(
		@param.query.string( 'secret' ) secret: string,
		@param.query.string( 'token' ) token: string,
	): Promise<any> {
		return this.userService.verify2FASecret( secret, token );
	}

	// Admin-only - return the list of users with their details.
	@authenticate( { strategy: 'jwt', options: { required: ['administrator'] } } )
	@get( '/users' )
	@response( 200 )
	async findAll(): Promise<User[]> {
		return this.userRepository.find( {
			fields: ['id', 'firstName', 'lastName', 'email', 'role', 'active', 'deleted'],
		} );
	}

	// ADmin enpoint to change user's role.
	@authenticate( { strategy: 'jwt', options: { required: ['administrator'] } } )
	@post( '/users/{id}/role/{role}' )
	@response( 204 )
	async updateRole(
		@param.path.number( 'id' ) id: number,
		@param.path.string( 'role' ) role: string,
		@inject( AuthenticationBindings.CURRENT_USER ) currentUser: UserProfile,
	): Promise<any> {
		// User who performs the editing.
		const adminUser = await this.userRepository.findById( currentUser.id );
		const user = await this.userRepository.findById( id );

		// Not-existing or deactivated user.
		if ( !user || !user.active || user.deleted ) {
			throw new NotFound( 'Invalid user account' );
		}

		if ( adminUser.id === id ) {
			throw new NotAllowed( 'Administrators can\'t change their roles.' );
		}

		if ( !['viewer', 'editor', 'administrator'].includes( role ) ) {
			throw new IncorrectData( 'Invalid user role' );
		}

		if ( role === user.role ) {
			throw new IncorrectData( 'User already has this role.' );
		}

		// All good to change the role.
		user.role = role;

		await this.userRepository.updateById( id, user );
	}

	// Admin enpoint to reset user's details.
	@authenticate( { strategy: 'jwt', options: { required: ['administrator'] } } )
	@post( '/users/{id}/reset' )
	@response( 204 )
	async resetUser(
		@param.path.number( 'id' ) id: number,
		@inject( AuthenticationBindings.CURRENT_USER ) currentUser: UserProfile,
	): Promise<any> {
		const user = await this.userRepository.findById( id );

		// Not-existing or deactivated user.
		if ( !user || user.deleted ) {
			throw new NotFound( 'Invalid user account' );
		}

		if ( currentUser.id === id ) {
			throw new NotAllowed( 'Administrators can\'t reset their own credentials.' );
		}

		const token = crypto.randomBytes( 48 ).toString( 'hex' );

		await this.userRepository.updateById( id, {
			active: false,
			invitedAt: moment().format(),
			inviteToken: token,
			role: 'viewer',
			password: '',
			faSecret: '',
		} );

		// Async. We don't wait for it here.
		this._sendActivationLink( user, token );
	}

	// Admin endpoint to deactivate the user permanently.
	@authenticate( { strategy: 'jwt', options: { required: ['administrator'] } } )
	@post( '/users/{id}/deactivate' )
	@response( 204 )
	async deactivateUser(
		@param.path.number( 'id' ) id: number,
		@inject( AuthenticationBindings.CURRENT_USER ) currentUser: UserProfile,
	): Promise<any> {
		const user = await this.userRepository.findById( id );

		// Not-existing or deactivated user.
		if ( !user || user.deleted ) {
			throw new NotFound( 'Invalid user account' );
		}

		if ( currentUser.id === id ) {
			throw new NotAllowed( 'Administrators can\'t deactivate their own credentials.' );
		}

		await this.userRepository.updateById( id, {
			deleted: true,
			active: false,
		} );
	}

	// Activating endpoint. Accepts a user with a correct invite token and other details.
	@post( '/activate' )
	@response( 200 )
	async activateUser(
		@requestBody() userData: any,
	): Promise<any> {
		const user = await this.userRepository.findOne( {
			where: {
				active: false,
				deleted: false,
				inviteToken: userData.token,
				invitedAt: {
					gt: moment().add( -24, 'hours' ).format(),
				},
			},
		} );

		if ( !user ) {
			throw new NotFound( 'User not found' );
		}

		if ( !userData.password || userData.password.length < 12 ) {
			throw new IncorrectData( 'Password is less than 12 characters in length' );
		}

		if ( !userData.secret || !userData.secret.length ) {
			throw new IncorrectData( 'No 2FA secret provided' );
		}

		let role = 'viewer';

		// Check for the first admin sign in.
		if (
			process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL === user.email &&
			( await this.userRepository.count() ).count === 1
		) {
			role = 'administrator';
		}

		await this.userRepository.updateById( user.id, {
			active: true,
			password: await this.hasher.hashPassword( userData.password ),
			faSecret: userData.secret,
			inviteToken: '',
			role: role,
		} );
	}

	// Helper method to send an email with activation link
	private async _sendActivationLink( user: Partial<User>, token: string ): Promise<void> {
		const linkUrl: string = String( process.env.ADMIN_PANEL_URL ) + '/?activate=' + token;
		const mailSubject = 'Invitation for your Casper Metrics account';
		const mailText = 'Please follow the link to complete your sign up process. Link expires in 24h. ' + linkUrl;
		const mailHtml = 'Please follow <a href="' + linkUrl + '">the link</a> to complete your signup process. Link expires in 24h.';

		logger.info( 'Sending admin dashboard invite email to ' + user.email );

		if ( process.env.OUTPUT_EMAILS_TO_LOG ) {
			logger.info( mailText );
		}

		if ( process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASSWORD ) {
			const transporter = nodemailer.createTransport( {
				host: process.env.SMTP_HOST,
				port: Number( process.env.SMTP_PORT ),
				secure: Number( process.env.SMTP_PORT ) === 465,
				auth: {
					user: process.env.SMTP_USER,
					pass: process.env.SMTP_PASSWORD,
				},
			} );

			await transporter.sendMail( {
				from: '"Casper Metrics" <' + process.env.FROM_EMAIL + '>',
				to: user.email,
				subject: mailSubject,
				text: mailText,
				html: mailHtml,
			} );
		}
	}
}
