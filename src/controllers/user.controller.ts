import { repository } from '@loopback/repository';
import {
	get,
	getModelSchemaRef,
	oas,
	OperationVisibility,
	param,
	patch,
	post,
	requestBody,
	response,
} from '@loopback/rest';
import { User } from '../models';
import { Credentials, UserRepository } from '../repositories';
import { JWTService } from '../services/jwt.service';
import { inject } from '@loopback/core';
import { PasswordHasherBindings, TokenServiceBindings, UserServiceBindings } from '../keys';
import { MyUserService } from '../services/user.service';
import { BcryptHasher } from '../services/hash.password';
import { IncorrectData, NotAllowed, NotFound } from '../errors/errors';
import { authenticate, AuthenticationBindings } from '@loopback/authentication';
import { OPERATION_SECURITY_SPEC } from '@loopback/authentication-jwt';
import { UserProfile } from '@loopback/security';

@oas.visibility( OperationVisibility.UNDOCUMENTED )
export class UserController {
	constructor(
		@repository( UserRepository )
		public userRepository: UserRepository,
		@inject( PasswordHasherBindings.PASSWORD_HASHER )
		public hasher: BcryptHasher,
		@inject( UserServiceBindings.USER_SERVICE )
		public userService: MyUserService,
		@inject( TokenServiceBindings.TOKEN_SERVICE )
		public jwtService: JWTService,
	) {
	}

	@authenticate( { strategy: 'jwt', options: { required: ['administrator'] } } )
	@post( '/new-user', {
		responses: {
			'200': {
				description: 'User',
			},
		},
	} )
	async newUser( @requestBody( {} ) user: User ) {

		if ( await this.userRepository.findOne( { where: { email: user.email } } ) ) {
			return {
				error: 'User with this email already exists.',
			};
		}

		if ( user.password.length < 12 ) {
			return {
				error: 'Password is less than 12 characters in length.',
			};
		}

		user.password = await this.hasher.hashPassword( user.password );
		const savedUser: User = await this.userRepository.create( user );
		const userProfile = await this.userService.convertToUserProfile( savedUser );
		return userProfile;
	}

	@post( '/login', {
		responses: {
			'200': {
				description: 'Token',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								token: {
									type: 'string',
								},
							},
						},
					},
				},
			},
		},
	} )
	async login(
		@requestBody( {
			content: {
				'application/json': {
					schema: {
						type: 'object',
						properties: {
							email: {
								type: 'string',
							},
							password: {
								type: 'string',
							},
						},
					},
				},
			},
		} ) credentials: any,
	): Promise<UserProfile> {
		const user = await this.userService.verifyCredentials( credentials );
		const userProfile = await this.userService.convertToUserProfile( user );
		const token = await this.jwtService.generateToken( userProfile );
		userProfile.token = token;
		return userProfile;
	}

	@authenticate( { strategy: 'jwt' } )
	@get( '/me', {
		security: OPERATION_SECURITY_SPEC,
		responses: {
			'200': {
				description: 'The current user profile',
				content: {
					'application/json': {
						schema: getModelSchemaRef( User ),
					},
				},
			},
		},
	} )
	async me(
		@inject( AuthenticationBindings.CURRENT_USER )
			currentUser: UserProfile,
	): Promise<Partial<User>> {
		const dbUser = await this.userRepository.findById( currentUser.id, {
			fields: [ 'id', 'email', 'firstName', 'lastName', 'role', 'fa' ]
		} );
		if ( !dbUser ) {
			throw new NotAllowed( 'Not allowed' );
		};

		return Promise.resolve( dbUser );
	}

	@authenticate( { strategy: 'jwt' } )
	@get( '/generate2fa', {
		security: OPERATION_SECURITY_SPEC,
		responses: {
			'200': {
				description: 'Generate 2FA for current user',
			},
		},
	} )
	async generate2fa(
		@inject( AuthenticationBindings.CURRENT_USER )
			currentUser: UserProfile,
	): Promise<any> {
		const dbUser = await this.userRepository.findById( currentUser.id );
		if ( !dbUser || !dbUser.active ) {
			throw new NotAllowed( 'Not allowed' );
		}

		return this.userService.generate2FASecret( dbUser.email );
	}


	@authenticate( { strategy: 'jwt', options: { required: ['administrator'] } } )
	@get( '/users' )
	@response( 200, {
		description: 'Array of User model instances',
		content: {
			'application/json': {
				schema: {
					type: 'array',
					items: getModelSchemaRef( User, { includeRelations: true } ),
				},
			},
		},
	} )
	async findAll(): Promise<User[]> {
		return this.userRepository.find( {
			fields: ['id', 'firstName', 'lastName', 'email', 'role', 'active', 'fa'],
		} );
	}

	@authenticate( { strategy: 'jwt' } )
	@post( '/users/{id}' )
	@response( 204, {
		description: 'User update',
	} )
	async updateById(
		@param.path.number( 'id' ) id: number,
		@inject( AuthenticationBindings.CURRENT_USER )
			currentUser: UserProfile,
		@requestBody( {
			content: {
				'application/json': {
					schema: getModelSchemaRef( User, { partial: true } ),
				},
			},
		} )
			user: Partial<User>,
	): Promise<any> {
		// User who performs the editing.
		const dbUser = await this.userRepository.findById( currentUser.id );

		// Not-existing or deactivated user.
		if ( !dbUser || !dbUser.active ) {
			throw new NotAllowed( 'Error updating profile' );
		}

		if ( dbUser.role !== 'administrator' ) {
			// Regular user can edit only their own profile. Excluding certain fields.
			if ( dbUser.id !== id ) {
				throw new NotAllowed( 'Error updating profile' );
			}
			delete user.role;
			delete user.active;
			delete user.email;
		} else {
			if ( dbUser.id === id ) {
				// Administrators can't deactivate themselves, neither change the role.
				delete user.role;
				delete user.active;
			} else {
				// Administrators only can disable 2FA for other users, but not to set the secret.
				delete user.faSecret;
			}
		}

		// Id cannot be changed.
		delete user.id;

		if ( user.password ) {
			if ( user.password.length < 12 ) {
				throw new IncorrectData( 'Password is less than 12 characters in length.' );
			}
			user.password = await this.hasher.hashPassword( user.password );
		}

		await this.userRepository.updateById( id, user );
	}
}
