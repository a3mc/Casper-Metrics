import { BootMixin } from '@loopback/boot';
import { ApplicationConfig } from '@loopback/core';
import { RestExplorerBindings, RestExplorerComponent, } from '@loopback/rest-explorer';
import { RepositoryMixin } from '@loopback/repository';
import { RestApplication } from '@loopback/rest';
import { ServiceMixin } from '@loopback/service-proxy';
import path from 'path';
import { MyAdminSequence } from './sequence-admin';
export { ApplicationConfig };

export class ApplicationAdmin extends BootMixin(
    ServiceMixin( RepositoryMixin( RestApplication ) ),
) {
    constructor( options: ApplicationConfig = {} ) {
        super( options );

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
}
