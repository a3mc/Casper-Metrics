import { ApplicationConfig, CasperMetricsApplication } from './application';
import { environment } from './environments/environment';
import { ApplicationAdmin } from './application-admin';

export * from './application';
export * from './application-admin';

export async function main( options: ApplicationConfig = {} ) {
    const app = new CasperMetricsApplication( options );
    await app.boot();
    await app.start();

    const url = app.restServer.url;
    console.log( `Server is running at ${ url }` );

    return app;
}

export async function admin( options: ApplicationConfig = {} ) {
    const app = new ApplicationAdmin( options );
    await app.boot();
    await app.start();

    const url = app.restServer.url;
    console.log( `Admin Server is running at ${ url }` );

    return app;
}

if ( require.main === module ) {
    // Run the application
    const config = {
        shutdown: {
            gracePeriod: 5000
        },
        rest: {
            port: +( process.env.PORT ?? environment.port ),
            host: process.env.HOST,
            // The `gracePeriodForClose` provides a graceful close for http/https
            // servers with keep-alive clients. The default value is `Infinity`
            // (don't force-close). If you want to immediately destroy all sockets
            // upon stop, set its value to `0`.
            // See https://www.npmjs.com/package/stoppable
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
        },
    };
    main( config ).catch( err => {
        console.error( 'Cannot start the application.', err );
        process.exit( 1 );
    } );

    const adminConfig = {
        rest: {
            port: +( process.env.ADMIN_PORT ?? environment.admin_port ),
            host: process.env.HOST,
            // The `gracePeriodForClose` provides a graceful close for http/https
            // servers with keep-alive clients. The default value is `Infinity`
            // (don't force-close). If you want to immediately destroy all sockets
            // upon stop, set its value to `0`.
            // See https://www.npmjs.com/package/stoppable
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
        },
    };
    admin( adminConfig ).catch( err => {
        console.error( 'Cannot start the admin application.', err );
        process.exit( 1 );
    } );
}
