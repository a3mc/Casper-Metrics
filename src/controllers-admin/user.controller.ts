import { Count, CountSchema, Filter, FilterExcludingWhere, repository, Where, } from '@loopback/repository';
import { del, get, getModelSchemaRef, param, patch, post, put, requestBody, response, } from '@loopback/rest';
import { User } from '../models';
import { UserRepository } from '../repositories';
import { JWTService } from '../services/jwt.service';
import { inject } from '@loopback/core';
import { PasswordHasherBindings, TokenServiceBindings, UserServiceBindings } from '../keys';
import { MyUserService } from '../services/user.service';
import { BcryptHasher } from '../services/hash.password';
import { validateCredentials } from '../services/validator.service';
import _ from 'lodash';
import { NotFound } from '../errors/errors';
import { authenticate, AuthenticationBindings, TokenService } from '@loopback/authentication';
import { OPERATION_SECURITY_SPEC } from '@loopback/authentication-jwt';
import {SecurityBindings, UserProfile} from '@loopback/security';

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

    @authenticate( { strategy: 'jwt', options: { required: ['administrator'] } } )
    @post( '/signup', {
        responses: {
            '200': {
                description: 'User',
            }
        }
    } )
    async signup( @requestBody( {} ) user: any ) {
        validateCredentials( _.pick( user, ['email', 'password', 'role'] ) );

        if ( await this.userRepository.findOne( { where: { email: user.email } } ) ) {
            return {
                error: 'User already exists.'
            };
        }

        user.password = await this.hasher.hashPassword( user.password );
        const savedUser: User = await this.userRepository.create( user );
        const userProfile = await this.userService.convertToUserProfile( savedUser );
        const token = await this.jwtService.generateToken( userProfile );
        userProfile.token = token;
        return userProfile;
    }

    @post( '/login', {
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
                            }
                        }
                    }
                }
            }
        } ) credentials: any
    ): Promise<any> {
        const user = await this.userService.verifyCredentials( credentials );
        const dbUser = await this.userRepository.findOne( { where: { id: user.id } } )
        if ( !dbUser ) {
            throw new NotFound( 'User not found.' );
        }
        const userProfile = await this.userService.convertToUserProfile( user );
        const token = await this.jwtService.generateToken( userProfile );
        userProfile.token = token;
        return userProfile;
    }

    @authenticate( { strategy: 'jwt' } )
    @get( '/me', {
        security: OPERATION_SECURITY_SPEC,
        responses: {
            '200': {
                description: 'The current user profile',
                content: {
                    'application/json': {
                        schema: getModelSchemaRef( User )
                    }
                }
            }
        }
    } )
    async me(
        @inject( AuthenticationBindings.CURRENT_USER )
            currentUser: UserProfile
    ): Promise<any> {

        const dbUser = await this.userRepository.findById( currentUser.id );
        if ( !dbUser ) return Promise.reject();
        return Promise.resolve( currentUser );
    }

    // @get( '/users/count' )
    // @response( 200, {
    //     description: 'User model count',
    //     content: { 'application/json': { schema: CountSchema } },
    // } )
    // async count(
    //     @param.where( User ) where?: Where<User>,
    // ): Promise<Count> {
    //     return this.userRepository.count( where );
    // }
    //
    // @get( '/users' )
    // @response( 200, {
    //     description: 'Array of User model instances',
    //     content: {
    //         'application/json': {
    //             schema: {
    //                 type: 'array',
    //                 items: getModelSchemaRef( User, { includeRelations: true } ),
    //             },
    //         },
    //     },
    // } )
    // async find(
    //     @param.filter( User ) filter?: Filter<User>,
    // ): Promise<User[]> {
    //     return this.userRepository.find( filter );
    // }
    //
    // @patch( '/users' )
    // @response( 200, {
    //     description: 'User PATCH success count',
    //     content: { 'application/json': { schema: CountSchema } },
    // } )
    // async updateAll(
    //     @requestBody( {
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef( User, { partial: true } ),
    //             },
    //         },
    //     } )
    //         user: User,
    //     @param.where( User ) where?: Where<User>,
    // ): Promise<Count> {
    //     return this.userRepository.updateAll( user, where );
    // }
    //
    // @get( '/users/{id}' )
    // @response( 200, {
    //     description: 'User model instance',
    //     content: {
    //         'application/json': {
    //             schema: getModelSchemaRef( User, { includeRelations: true } ),
    //         },
    //     },
    // } )
    // async findById(
    //     @param.path.number( 'id' ) id: number,
    //     @param.filter( User, { exclude: 'where' } ) filter?: FilterExcludingWhere<User>
    // ): Promise<User> {
    //     return this.userRepository.findById( id, filter );
    // }
    //
    // @patch( '/users/{id}' )
    // @response( 204, {
    //     description: 'User PATCH success',
    // } )
    // async updateById(
    //     @param.path.number( 'id' ) id: number,
    //     @requestBody( {
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef( User, { partial: true } ),
    //             },
    //         },
    //     } )
    //         user: User,
    // ): Promise<void> {
    //     await this.userRepository.updateById( id, user );
    // }
    //
    // @put( '/users/{id}' )
    // @response( 204, {
    //     description: 'User PUT success',
    // } )
    // async replaceById(
    //     @param.path.number( 'id' ) id: number,
    //     @requestBody() user: User,
    // ): Promise<void> {
    //     await this.userRepository.replaceById( id, user );
    // }
    //
    // @del( '/users/{id}' )
    // @response( 204, {
    //     description: 'User DELETE success',
    // } )
    // async deleteById( @param.path.number( 'id' ) id: number ): Promise<void> {
    //     await this.userRepository.deleteById( id );
    // }
}
