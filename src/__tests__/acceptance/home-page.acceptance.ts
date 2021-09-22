import { Client } from '@loopback/testlab';
import { CasperMetricsApplication } from '../..';
import { setupApplication } from './test-helper';

describe( 'HomePage', () => {
    let app: CasperMetricsApplication;
    let client: Client;

    before( 'setupApplication', async () => {
        ( { app, client } = await setupApplication() );
    } );

    after( async () => {
        await app.stop();
    } );

    it( 'exposes explorer page', async () => {
        await client
            .get( '/explorer/' )
            .expect( 200 )
            .expect( 'Content-Type', /text\/html/ )
            .expect( /<title>Casper Metrics API/ );
    } );

    it( 'have swagger css files', async () => {
        await client
            .get( '/css/swagger.css' )
            .expect( 200 )
            .expect( 'Content-Type', /text\/css/ )
            .expect( /.swagger-ui/ );
    } );

    it( 'have swagger js files', async () => {
        await client
            .get( '/explorer/swagger-ui-bundle.js' )
            .expect( 200 );

        await client
            .get( '/explorer/swagger-ui-standalone-preset.js' )
            .expect( 200 );
    } );
} );
