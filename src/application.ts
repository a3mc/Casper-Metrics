import { AuthenticationComponent, registerAuthenticationStrategy } from '@loopback/authentication';
import { SECURITY_SCHEME_SPEC } from '@loopback/authentication-jwt';
import { BootMixin } from '@loopback/boot';
import { ApplicationConfig } from '@loopback/core';
import { RepositoryMixin } from '@loopback/repository';
import { RestApplication } from '@loopback/rest';
import { ServiceMixin } from '@loopback/service-proxy';
import * as path from 'path';
import { AdminLogServiceBindings, PasswordHasherBindings, TokenServiceBindings, TokenServiceConstants, UserServiceBindings } from './keys';
import { MySequence } from './sequence';
import { AdminLogService } from './services';
import { BcryptHasher } from './services/hash.password';
import { JWTService } from './services/jwt.service';
import { MyUserService } from './services/user.service';
import { JWTStrategy } from './strategies/jwt-strategies';

export { ApplicationConfig };

export class CasperMetricsApplication extends BootMixin(
	ServiceMixin( RepositoryMixin( RestApplication ) ),
) {
	constructor( options: ApplicationConfig = {} ) {
		super( options );

		this.setupBinding();
		this.addSecuritySpec();
		this.component( AuthenticationComponent );
		registerAuthenticationStrategy( this, JWTStrategy );
		this.sequence( MySequence );

		this.projectRoot = __dirname;

		console.log(__dirname)

		this.static('/explorer/openapi.json', path.join(__dirname, 'openapi.json'));

		this.bootOptions = {
			controllers: {
				dirs: ['controllers'],
				extensions: ['.controller.js'],
				nested: true,
			},
		};
	}

	setupBinding(): void {
		if ( !TokenServiceConstants.TOKEN_SECRET_VALUE ) {
			throw new Error( 'No JWT token secret set.' );
		}

		this.bind( PasswordHasherBindings.PASSWORD_HASHER ).toClass( BcryptHasher );
		this.bind( PasswordHasherBindings.ROUNDS ).to( 10 );
		this.bind( UserServiceBindings.USER_SERVICE ).toClass( MyUserService );
		this.bind( TokenServiceBindings.TOKEN_SERVICE ).toClass( JWTService );
		this.bind( TokenServiceBindings.TOKEN_SECRET ).to( TokenServiceConstants.TOKEN_SECRET_VALUE );
		this.bind( TokenServiceBindings.TOKEN_EXPIRES_IN ).to( TokenServiceConstants.TOKEN_EXPIRES_IN_VALUE );
		this.bind( AdminLogServiceBindings.ADMINLOG_SERVICE ).toClass( AdminLogService );
	}

	addSecuritySpec(): void {
		this.api( {
			openapi: '3.0.0',
			info: {
				title: 'Casper Metrics API',
				version: '0.2.3',
			},
			paths: {},
			components: { securitySchemes: SECURITY_SCHEME_SPEC },
			security: [{ jwt: [] }],
			servers: [{ url: '/' }],
		} );
	}

}
