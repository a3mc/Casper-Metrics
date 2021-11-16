import { BootMixin } from '@loopback/boot';
import { ApplicationConfig } from '@loopback/core';
import { RestExplorerBindings, RestExplorerComponent, } from '@loopback/rest-explorer';
import { RepositoryMixin } from '@loopback/repository';
import { RestApplication } from '@loopback/rest';
import { ServiceMixin } from '@loopback/service-proxy';
import { MyAdminSequence } from './sequence-admin';
import dotenv from 'dotenv';
import { AuthenticationComponent } from '@loopback/authentication';
import {
    JWTAuthenticationComponent, JWTService,
    MyUserService,
    SECURITY_SCHEME_SPEC,
    UserServiceBindings,
} from '@loopback/authentication-jwt';
import { PasswordHasherBindings, TokenServiceBindings, TokenServiceConstants } from './keys';
import { BcryptHasher } from './services/hash.password';
import { MetricsDbDataSource } from './datasources';

dotenv.config();

export { ApplicationConfig };


export class ApplicationAdmin extends BootMixin(
    ServiceMixin( RepositoryMixin( RestApplication ) ),
) {
    constructor( options: ApplicationConfig = {} ) {
        super( options );


        this.component( AuthenticationComponent );

        // Set up the custom sequence
        this.sequence( MyAdminSequence );

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
                dirs: ['controllers-admin'],
                extensions: ['.controller.js'],
                nested: true,
            },
        };

        // Mount authentication system
        this.component( AuthenticationComponent );
        // Mount jwt component
        this.component( JWTAuthenticationComponent );
        // Bind datasource
        this.dataSource(MetricsDbDataSource, UserServiceBindings.DATASOURCE_NAME);
    }

    etupBinding(): void {
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
                title: 'Casper metrics API (admin)',
                version: '0.0.1'
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
