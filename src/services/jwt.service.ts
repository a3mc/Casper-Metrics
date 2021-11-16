import { HttpErrors }              from '@loopback/rest';
import { securityId, UserProfile } from '@loopback/security';
import { promisify }               from 'util';
import { TokenServiceConstants }   from '../keys';
import TOKEN_EXPIRES_IN_VALUE = TokenServiceConstants.TOKEN_EXPIRES_IN_VALUE;
import { repository }              from "@loopback/repository";
import { UserRepository }          from "../repositories";
import { NotFound }                from "../errors/errors";

const jwt = require( 'jsonwebtoken' );
const signAsync = promisify( jwt.sign );
const verifyAsync = promisify( jwt.verify );

export class JWTService {
    // @inject('authentication.jwt.secret')
    //@inject( TokenServiceBindings.TOKEN_SECRET )
    public readonly jwtSecret: string = 'FIXME!TEST';

    //@inject( TokenServiceBindings.TOKEN_EXPIRES_IN )
    public readonly expiresSecret: string = TOKEN_EXPIRES_IN_VALUE;


    constructor(
        @repository( UserRepository )
        public userRepository: UserRepository,
    ) {

    }

    async generateToken( userProfile: UserProfile ): Promise<string> {
        if ( !userProfile ) {
            throw new HttpErrors.Unauthorized(
                'Error while generating token :userProfile is null'
            );
        }
        let token = '';
        try {
            token = await signAsync( userProfile, this.jwtSecret, {
                expiresIn: this.expiresSecret
            } );
            return token;
        } catch ( err ) {
            throw new HttpErrors.Unauthorized(
                `Error generating token ${ err }`
            );
        }
    }

    async verifyToken( token: string ): Promise<UserProfile> {

        if ( !token ) {
            throw new HttpErrors.Unauthorized(
                `Error verifying token: 'token' is null`
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
                    permissions: decryptedToken.permissions
                }
            );

            const userResult = await this.userRepository.findById( decryptedToken.id );
            if ( !userResult ) {
                throw new NotFound( 'User not found.' );
            }

        } catch ( err ) {
            throw new HttpErrors.Unauthorized( `Error verifying token:${ err.message }` );
        }
        return userProfile;
    }
}
