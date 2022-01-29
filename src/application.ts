import { BootMixin } from '@loopback/boot';
import { ApplicationConfig } from '@loopback/core';
import { RestExplorerBindings, RestExplorerComponent, } from '@loopback/rest-explorer';
import { RepositoryMixin } from '@loopback/repository';
import { RestApplication } from '@loopback/rest';
import { ServiceMixin } from '@loopback/service-proxy';
import { MySequence } from './sequence';
import { AuthenticationComponent, registerAuthenticationStrategy } from '@loopback/authentication';
import { PasswordHasherBindings, TokenServiceBindings, TokenServiceConstants, UserServiceBindings } from './keys';
import { BcryptHasher } from './services/hash.password';
import { JWTStrategy } from './strategies/jwt-strategies';
import { SECURITY_SCHEME_SPEC } from '@loopback/authentication-jwt';
import { MyUserService } from './services/user.service';
import { JWTService } from './services/jwt.service';

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

        // Set up the custom sequence
        this.sequence( MySequence );

        // Customize @loopback/rest-explorer configuration here
        this.configure( RestExplorerBindings.COMPONENT ).to( {
            useSelfHostedSpec: true,
            indexTemplatePath: '',
        } );
        this.component( RestExplorerComponent );

        this.projectRoot = __dirname;
        // Customize @loopback/boot Booter Conventions here
        this.bootOptions = {
            controllers: {
                // Customize ControllerBooter Conventions here
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
    }

    addSecuritySpec(): void {
        this.api( {
            openapi: '3.0.0',
            info: {
                title: 'Casper Metrics API',
                version: '0.2.2'
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
