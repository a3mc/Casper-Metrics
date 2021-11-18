import { ApplicationConfig, CasperMetricsApplication } from './application';
import { ApplicationAdmin } from './application-admin';
import { logger } from './logger';
import dotenv from 'dotenv';
dotenv.config();

export * from './application';
export * from './application-admin';

export async function main( options: ApplicationConfig = {} ) {
    const app = new CasperMetricsApplication( options );
    await app.boot();
    await app.start();

    const url = app.restServer.url;
    console.log( `Public API Server is running at ${ url }` );

    return app;
}

export async function admin( options: ApplicationConfig = {} ) {
    const app = new ApplicationAdmin( options );
    await app.boot();
    await app.start();

    const url = app.restServer.url;
    console.log( `Admin API Server is running at ${ url }` );

    return app;
}

if ( require.main === module ) {
    // Run the application

    if ( process.env.PUBLIC_API_PORT  ) {
        const config = {
            shutdown: {
                gracePeriod: 5000
            },
            rest: {
                port: process.env.PUBLIC_API_PORT,
                host: process.env.HOST,
                gracePeriodForClose: 5000, // 5 seconds
                openApiSpec: {
                    // useful when used with OpenAPI-to-GraphQL to locate your application
                    setServersFromRequest: true,
                    disabled: true,
                },
                expressSettings: {
                    'x-powered-by': false,
                    env: 'production',
                },
                basePath: '/',
                cors: {
                    origin: '*',
                    methods: 'OPTIONS,GET,HEAD',
                    preflightContinue: false,
                    optionsSuccessStatus: 204,
                    credentials: true,
                },
            },
        };
        main( config ).catch( err => {
            console.error( 'Cannot start the application.', err );
            process.exit( 1 );
        } );
    }

    if ( process.env.ADMIN_API_PORT ) {
        const adminConfig = {
            rest: {
                port: process.env.ADMIN_API_PORT,
                host: process.env.HOST,
                gracePeriodForClose: 5000, // 5 seconds
                openApiSpec: {
                    // useful when used with OpenAPI-to-GraphQL to locate your application
                    setServersFromRequest: true,
                    disabled: true,
                },
                expressSettings: {
                    'x-powered-by': false,
                    env: 'production',
                },
                basePath: '/',
                cors: {
                    origin: '*',
                    methods: 'OPTIONS,GET,HEAD,PUT,PATCH,POST,DELETE',
                    preflightContinue: false,
                    optionsSuccessStatus: 204,
                    credentials: true,
                },
            },
        };
        admin( adminConfig ).catch( err => {
            console.error( 'Cannot start the admin application.', err );
            process.exit( 1 );
        } );
    }

}
