// A file to store tokens that used in the applications.
// They are required for some ways of injection.

import { TokenService, UserService } from '@loopback/authentication';
import { BindingKey } from '@loopback/core';
import dotenv from 'dotenv';
import { User } from './models';
import { Credentials } from './repositories/user.repository';
import { AdminLogService } from './services';
import { PasswordHasher } from './services/hash.password';

dotenv.config();

export namespace TokenServiceConstants {
	// Jwt-tokens are used only for admin endpoints and have an expiration set to 24h.
	export const TOKEN_SECRET_VALUE = process.env.JWT_SECRET;
	export const TOKEN_EXPIRES_IN_VALUE = '24h';
}
export namespace TokenServiceBindings {
	// Tokens that are need in order to JWT mechanism to work correctly.
	export const TOKEN_SECRET = BindingKey.create<string>(
		'authentication.jwt.secret',
	);
	export const TOKEN_EXPIRES_IN = BindingKey.create<string>(
		'authentication.jwt.expiresIn',
	);
	export const TOKEN_SERVICE = BindingKey.create<TokenService>(
		'services.jwt.service',
	);
}

export namespace PasswordHasherBindings {
	export const PASSWORD_HASHER = BindingKey.create<PasswordHasher>(
		'services.hasher',
	);
	export const ROUNDS = BindingKey.create<number>( 'services.hasher.rounds' );
}

export namespace UserServiceBindings {
	export const USER_SERVICE = BindingKey.create<UserService<Credentials, User>>(
		'services.user.service',
	);
}

export namespace AdminLogServiceBindings {
	export const ADMINLOG_SERVICE = BindingKey.create<AdminLogService>(
		'services.adminlog.service',
	);
}

