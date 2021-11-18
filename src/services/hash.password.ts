import { inject }                 from '@loopback/core';
import { compare, genSalt, hash } from 'bcryptjs';
import { PasswordHasherBindings } from '../keys';

export interface PasswordHasher<T = string> {
    hashPassword( password: T ): Promise<T>;

    comparePassword( provdedPass: T, storedPass: T ): Promise<boolean>
}

export class BcryptHasher implements PasswordHasher<string> {
    // @inject('rounds')
    @inject( PasswordHasherBindings.ROUNDS )
    public readonly rounds: number;

    async comparePassword( provdedPass: string, storedPass: string ): Promise<boolean> {
        const passwordMatches = await compare( provdedPass, storedPass );
        return passwordMatches;
    }

    // round: number = 10;
    async hashPassword( password: string ): Promise<string> {
        const salt = await genSalt( this.rounds );
        return await hash( password, salt );
    }
}
