import { HttpErrors }  from '@loopback/rest';
import * as isEmail    from 'isemail';
import { Credentials } from '../repositories/index';

export function validateCredentials( credentials: Credentials ) {
    if ( !isEmail.validate( credentials.email ) ) {
        throw new HttpErrors.UnprocessableEntity( 'Invalid Email' );
    }
    if ( credentials.password.length < 10 ) {
        throw new HttpErrors.UnprocessableEntity( 'Password should be at least 10 symbols' );
    }
}
