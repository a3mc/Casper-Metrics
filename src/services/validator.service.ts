import { HttpErrors } from '@loopback/rest';
import * as isEmail from 'isemail';
import { Credentials } from '../repositories/index';

// Just a method to validate provided credentials.
// It doesn't play any security role, just a helper for correct data input.
export function validateCredentials( credentials: Credentials ) {
	if ( !isEmail.validate( credentials.email ) ) {
		throw new HttpErrors.UnprocessableEntity( 'Invalid Email' );
	}
	if ( !credentials.password || credentials.password.length < 12 ) {
		throw new HttpErrors.UnprocessableEntity( 'Password should be at least 12 symbols' );
	}
}
