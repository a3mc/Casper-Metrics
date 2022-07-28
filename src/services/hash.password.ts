import { inject } from '@loopback/core';
import { compare, genSalt, hash } from 'bcryptjs';
import { PasswordHasherBindings } from '../keys';

// Interface of the hasher.
export interface PasswordHasher<T = string> {
	hashPassword( password: T ): Promise<T>;

	comparePassword( provdedPass: T, storedPass: T ): Promise<boolean>;
}

// A helper class for password/hashes operations.
export class BcryptHasher implements PasswordHasher<string> {
	// @inject('rounds')
	@inject( PasswordHasherBindings.ROUNDS )
	public readonly rounds: number;

	// Return if password and hash match, by using bcryptjs algorithm.
	async comparePassword( provdedPass: string, storedPass: string ): Promise<boolean> {
		const passwordMatches = await compare( provdedPass, storedPass );
		return passwordMatches;
	}

	// Generate a hash from password.
	async hashPassword( password: string ): Promise<string> {
		const salt = await genSalt( this.rounds );
		return await hash( password, salt );
	}
}
