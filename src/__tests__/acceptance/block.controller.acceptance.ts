import { Client, expect } from '@loopback/testlab';
import { CasperMetricsApplication } from '../..';
import { setupApplication } from './test-helper';

describe( 'BlockController', () => {
    let app: CasperMetricsApplication;
    let client: Client;

    before( 'setupApplication', async () => {
        ( { app, client } = await setupApplication() );
    } );

    after( async () => {
        await app.stop();
    } );

    it( 'invokes GET block/circulating', async () => {
        const res = await client.get( '/block/circulating' ).expect( 200 );
    } );

    it( 'invokes GET block/total', async () => {
        const res = await client.get( '/block/total' ).expect( 200 );
    } );

    it( 'invokes GET block', async () => {
        const res = await client.get( '/block' ).expect( 200 );
        expect( res.body[0].blockHeight ).to.Number();
        expect( res.body[0].transfersCount ).to.Number();
        expect( res.body[0].deploysCount ).to.Number();
        expect( res.body[0].circulatingSupply ).to.Number();
        expect( res.body[0].validatorsWeights ).to.Number();
        expect( res.body[0].totalSupply ).to.Number();
        expect( res.body[0].validatorsRewards ).to.Number();
        expect( res.body[0].delegatorsRewards ).to.Number();
        expect( res.body[0].rewards ).to.Number();
        expect( res.body[0].validatorsCount ).to.Number();
        expect( res.body[0].delegatorsCount ).to.Number();
        expect( res.body[0].stakedDiffSinceGenesis ).to.Number();
    } );
} );
