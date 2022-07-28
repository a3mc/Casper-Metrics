import { repository } from '@loopback/repository';
import { HttpErrors } from '@loopback/rest';
import { securityId, UserProfile } from '@loopback/security';
import { promisify } from 'util';
import { NotAllowed, NotFound } from '../errors/errors';
import { TokenServiceConstants } from '../keys';
import { UserRepository } from '../repositories';
import TOKEN_EXPIRES_IN_VALUE = TokenServiceConstants.TOKEN_EXPIRES_IN_VALUE;
import TOKEN_SECRET_VALUE = TokenServiceConstants.TOKEN_SECRET_VALUE;
const jwt = require( 'jsonwebtoken' );

// Promisify is used for the sign and veryfy methods to make it more elegant when dealing in async manner.
const signAsync = promisify( jwt.sign );
const verifyAsync = promisify( jwt.verify );

// This service class issues or validates a given token based on the secret.
export class JWTService {
	// Secret value comes from the env file, but it's used only for admin part.
	public readonly jwtSecret: string = TOKEN_SECRET_VALUE || 'empty';
	public readonly expiresSecret: string = TOKEN_EXPIRES_IN_VALUE;

	constructor(
		@repository( UserRepository )
		public userRepository: UserRepository,
	) {
	}

	// Generate and return a new token based on the given user profile.
	async generateToken( userProfile: UserProfile ): Promise<string> {
		if ( !userProfile ) {
			throw new HttpErrors.Unauthorized(
				'Error while generating token :userProfile is null',
			);
		}
		let token = '';
		try {
			token = await signAsync( userProfile, this.jwtSecret, {
				expiresIn: this.expiresSecret,
			} );
			return token;
		} catch ( err ) {
			throw new HttpErrors.Unauthorized(
				`Error generating token ${ err }`,
			);
		}
	}

	// Return a user profile if token is valid or thrown an error.
	async verifyToken( token: string ): Promise<UserProfile> {
		if ( !token ) {
			throw new HttpErrors.Unauthorized(
				`Error verifying token: 'token' is null`,
			);
		}

		let userProfile: UserProfile;
		try {
			const decryptedToken = await verifyAsync( token, this.jwtSecret );
			userProfile = Object.assign(
				{ [securityId]: '', id: '', name: '', permissions: [] },
				{
					[securityId]: decryptedToken.id,
					id: decryptedToken.id,
					name: decryptedToken.name,
					permissions: decryptedToken.permissions,
				},
			);

			const userResult = await this.userRepository.findById( decryptedToken.id );
			if ( !userResult ) {
				throw new NotFound( 'User not found.' );
			}

			if ( !userResult.active || userResult.deleted ) {
				throw new NotAllowed( 'Access not allowed.' );
			}

		} catch ( err ) {
			throw new HttpErrors.Unauthorized( `Error verifying token:${ err.message }` );
		}
		return userProfile;
	}
}
