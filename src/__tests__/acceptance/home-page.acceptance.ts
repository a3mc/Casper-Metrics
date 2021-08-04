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

    it( 'exposes a default home page', async () => {
        await client
            .get( '/explorer/' )
            .expect( 200 )
            .expect( 'Content-Type', /text\/html/ );
    } );

    it( 'exposes a home page', async () => {
        await client
            .get( '/explorer/' )
            .expect( 200 )
            .expect( 'Content-Type', /text\/html/ )
            .expect( /<title>Casper Metrics API/ );
    } );
} );
