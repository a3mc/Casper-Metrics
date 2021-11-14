import {
    Count,
    CountSchema,
    Filter,
    FilterExcludingWhere,
    repository,
    Where,
} from '@loopback/repository';
import {
    post,
    param,
    get,
    getModelSchemaRef,
    patch,
    put,
    del,
    requestBody,
    response,
} from '@loopback/rest';
import { User } from '../models';
import { UserRepository } from '../repositories';
import { inject } from '@loopback/core';

export class UserController {
    constructor(
        @repository( UserRepository )
        public userRepository: UserRepository,
        @inject( PasswordHasherBindings.PASSWORD_HASHER )
        public hasher: BcryptHasher
    ) {
    }

    @post( '/auth', {
        responses: {
            '200': {
                description: 'Token',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                token: {
                                    type: 'string'
                                }
                            }
                        }
                    }
                }
            }
        }
    } )
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
        const user = await this.verifyCredentials( credentials );

        const dbUser = await this.userRepository.findOne( { where: { id: user.id } } )
        if ( !dbUser ) {
            throw new Error( 'User not found.' );
        }

        const userProfile = await this.userService.convertToUserProfile( user );
        const token = await this.jwtService.generateToken( userProfile );
        userProfile.token = token;
        userProfile.balance = dbUser.tokens;
        userProfile.egldAddress = dbUser.egldAddress;

        //userProfile.balance = String( await WalletController.getUserBalance( user.innerAddress ) );

        return userProfile;
    }

    async verifyCredentials( credentials: any ): Promise<User> {
        // implement this method
        const foundUser = await this.userRepository.findOne( {
            where: {
                email: credentials.email
            }
        } );
        if ( !foundUser ) {
            throw new Error( 'User not found' );
        }
        const passwordMatched = await this.hasher.comparePassword( credentials.password, foundUser.password );
        if ( !passwordMatched ) {
            throw new Error( 'Password is not valid' );
        }
        return foundUser;
    }
}
