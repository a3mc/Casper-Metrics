import { repository, } from '@loopback/repository';
import { post, requestBody, } from '@loopback/rest';
import { User } from '../models';
import { UserRepository } from '../repositories';
import { inject } from '@loopback/core';
import { PasswordHasherBindings, TokenServiceBindings } from '../keys';
import { BcryptHasher } from '../services/hash.password';
import { MyUserService, UserServiceBindings } from '@loopback/authentication-jwt';
import { JWTService } from '../services/jwt.service';
import { NotFound } from '../errors';

export class UserController {
    constructor(
        @repository( UserRepository )
        public userRepository: UserRepository,
        @inject( PasswordHasherBindings.PASSWORD_HASHER )
        public hasher: BcryptHasher,
        @inject( UserServiceBindings.USER_SERVICE )
        public userService: MyUserService,
        @inject( TokenServiceBindings.TOKEN_SERVICE )
        public jwtService: JWTService,
    ) {
    }

    @post( '/api/auth')
    async login(
        @requestBody( {
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            email: {
                                type: 'string'
                            },
                            password: {
                                type: 'string'
                            },
                        }
                    }
                }
            }
        } ) credentials: any
    ): Promise<any> {
        const foundUser = await this.userRepository.findOne( {
            where: {
                email: credentials.email
            }
        } );
        if( !foundUser ) {
            return {
                error: 'User not found'
            }
        }
        const passwordMatched = await this.hasher.comparePassword( credentials.password, foundUser.password );
        if( !passwordMatched ) {
            return {
                error: 'Password is invalid'
            }
        }
        const token = await this.jwtService.generateToken( credentials );
        console.log( token )
        return {
            token: token
        };
    }
}
