import { BootMixin } from '@loopback/boot';
import { ApplicationConfig } from '@loopback/core';
import { RestExplorerBindings, RestExplorerComponent, } from '@loopback/rest-explorer';
import { RepositoryMixin } from '@loopback/repository';
import { RestApplication } from '@loopback/rest';
import { ServiceMixin } from '@loopback/service-proxy';
import path from 'path';
import { MyAdminSequence } from './sequence-admin';
import { AuthenticationComponent, registerAuthenticationStrategy } from '@loopback/authentication';
import { MyUserService, SECURITY_SCHEME_SPEC, UserServiceBindings } from '@loopback/authentication-jwt';
import { PasswordHasherBindings, TokenServiceBindings, TokenServiceConstants } from './keys';
import { BcryptHasher } from './services/hash.password';
import { JWTService } from './services/jwt.service';
export { ApplicationConfig };
import dotenv from 'dotenv';
import { JWTStrategy } from './jwt-stratageies';
dotenv.config();

export class ApplicationAdmin extends BootMixin(
    ServiceMixin( RepositoryMixin( RestApplication ) ),
) {
    constructor( options: ApplicationConfig = {} ) {
        super( options );

        this.setupBinding();

        this.addSecuritySpec();

        this.component( AuthenticationComponent );
        registerAuthenticationStrategy( this, JWTStrategy );

        // Set up the custom sequence
        this.sequence( MyAdminSequence );

        // Set up default home page
        //this.static( '/', path.join( __dirname, '../dist-admin' ) );
        //this.static( '/css', path.join( __dirname, '../public/css' ) );

        // Customize @loopback/rest-explorer configuration here
        this.configure( RestExplorerBindings.COMPONENT ).to( {
            //path: '/explorer',
            //swaggerThemeFile: '/css/swagger.css',
            useSelfHostedSpec: true,
            indexTemplatePath: '',
        } );
        this.component( RestExplorerComponent );

        this.projectRoot = __dirname;
        // Customize @loopback/boot Booter Conventions here
        this.bootOptions = {
            controllers: {
                // Customize ControllerBooter Conventions here
                dirs: ['controllers-admin'],
                extensions: ['.controller.js'],
                nested: true,
            },
        };
    }

    setupBinding(): void {
        this.bind( PasswordHasherBindings.PASSWORD_HASHER ).toClass( BcryptHasher );
        this.bind( PasswordHasherBindings.ROUNDS ).to( 10 );
        this.bind( UserServiceBindings.USER_SERVICE ).toClass( MyUserService );
        this.bind( TokenServiceBindings.TOKEN_SERVICE ).toClass( JWTService );
        this.bind( TokenServiceBindings.TOKEN_SECRET ).to( TokenServiceConstants.TOKEN_SECRET_VALUE );
        this.bind( TokenServiceBindings.TOKEN_EXPIRES_IN ).to( TokenServiceConstants.TOKEN_EXPIRES_IN_VALUE );
    }

    addSecuritySpec(): void {
        this.api( {
            openapi: '3.0.0',
            info: {
                title: 'Release Monster API (admin)',
                version: '0.3.1'
            },
            paths: {},
            components: { securitySchemes: SECURITY_SCHEME_SPEC },
            security: [
                {
                    // secure all endpoints with 'jwt'
                    jwt: []
                }
            ],
            servers: [{ url: '/' }]
        } );
    }
}
