import { AuthenticationStrategy } from '@loopback/authentication';
import { inject } from '@loopback/core';
import { HttpErrors, RedirectRoute } from '@loopback/rest';
import { UserProfile } from '@loopback/security';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { TokenServiceBindings } from '../keys';
import { JWTService } from '../services/jwt.service';

// This class provides JWT auth strategy and is built upon the examples from the Loopback framework.
export class JWTStrategy implements AuthenticationStrategy {
	name: string = 'jwt';
	//Inject a JWT service via a Token Binding that performs validations and other methods.
	@inject( TokenServiceBindings.TOKEN_SERVICE )
	public jwtService: JWTService;

	async authenticate( request: Request<ParamsDictionary, any, any, ParsedQs> ):
		Promise<UserProfile | RedirectRoute | undefined> {

		const token: string = this.extractCredentials( request );
		// If the token was extracted, validate its validity then.
		const userProfile = await this.jwtService.verifyToken( token );
		return Promise.resolve( userProfile );
	}

	// Get the token if its format was correct.
	extractCredentials( request: Request<ParamsDictionary, any, any, ParsedQs> ): string {
		if ( !request.headers.authorization ) {
			throw new HttpErrors.Unauthorized( 'Authorization is missing' );
		}
		const authHeaderValue = request.headers.authorization;

		// authorization : Bearer xxxx.yyyy.zzzz
		if ( !authHeaderValue.startsWith( 'Bearer' ) ) {
			throw new HttpErrors.Unauthorized( 'Authorization header is not a type of Bearer' );
		}
		const parts = authHeaderValue.split( ' ' );
		if ( parts.length !== 2 ) {
			throw new HttpErrors.Unauthorized( `Authorization header must follow this pattern: 'Bearer xx.yy.zz` );
		}
		const token = parts[1];
		return token;
	}

}
