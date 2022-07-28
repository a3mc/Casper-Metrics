import { UserService } from '@loopback/authentication';
import { inject } from '@loopback/core';
import { repository } from '@loopback/repository';
import { HttpErrors } from '@loopback/rest';
import { securityId, UserProfile } from '@loopback/security';
import { PasswordHasherBindings } from '../keys';
import { User } from '../models';
import { Credentials, UserRepository } from '../repositories';
import { BcryptHasher } from './hash.password';

const twofactor = require( 'node-2fa' );

// This service class performs checks and transforms of user credeintials.
// It used only in for the admin endpoints.
export class MyUserService implements UserService<User, Credentials> {
	// To initialise, it injects password hasher and the user repository.
	constructor(
		@repository( UserRepository )
		public userRepository: UserRepository,
		@inject( PasswordHasherBindings.PASSWORD_HASHER )
		public hasher: BcryptHasher,
	) {
	}

	// Check that credentials exist in the database and user is active and valid. Return the user if correct.
	async verifyCredentials( credentials: Credentials ): Promise<User> {
		const foundUser = await this.userRepository.findOne( {
			where: {
				email: credentials.email,
				active: true,
				deleted: false,
			},
		} );
		if ( !foundUser ) {
			throw new HttpErrors.NotFound( 'User not found' );
		}

		if ( !credentials.password || !foundUser.password ) {
			throw new HttpErrors.Unauthorized( 'Password is not valid' );
		}

		// Check password with comparing it to a stored hash.
		const passwordMatched = await this.hasher.comparePassword( credentials.password, foundUser.password );
		if ( !passwordMatched ) {
			throw new HttpErrors.Unauthorized( 'Password is not valid' );
		}

		if ( !credentials.faCode ) {
			throw new HttpErrors.Unauthorized( 'No 2FA code provided' );
		}

		if ( !twofactor.verifyToken( foundUser.faSecret, credentials.faCode ) ) {
			throw new HttpErrors.Unauthorized( '2FA code is not valid' );
		}

		return foundUser;
	}

	// Check if the provided 2FA is valid, using twoFactor library.
	verify2FASecret( secret: string, token: string ): boolean {
		return !!twofactor.verifyToken( secret, token );
	}

	// Take and return only fields required for the user profile.
	convertToUserProfile( user: User ): UserProfile {
		return {
			[securityId]: user.id!.toString(),
			id: user.id,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role,
			permissions: user.role,
		};
	}

	// Generate a new 2FA token for a given email.
	generate2FASecret( email: string ): any {
		const result = twofactor.generateSecret(
			{
				name: 'Casper Metrics',  // Automatically add name
				account: email,
			},
		);
		// We don't need a QR at this step, so return the result without it.
		delete result.qr;
		return result;
	}

}
