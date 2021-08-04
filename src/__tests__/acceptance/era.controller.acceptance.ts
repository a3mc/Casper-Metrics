import { Client, expect } from '@loopback/testlab';
import { CasperMetricsApplication } from '../..';
import { setupApplication } from './test-helper';

describe( 'EraController', () => {
    let app: CasperMetricsApplication;
    let client: Client;

    before( 'setupApplication', async () => {
        ( { app, client } = await setupApplication() );
    } );

    after( async () => {
        await app.stop();
    } );

    it( 'invokes GET era/circulating', async () => {
        const res = await client.get( '/era/circulating' ).expect( 200 );
    } );

    it( 'invokes GET era/total', async () => {
        const res = await client.get( '/era/total' ).expect( 200 );
    } );

    it( 'invokes GET era', async () => {
        const res = await client.get( '/era' ).expect( 200 );
        expect( res.body[0].id ).to.Number();
        expect( res.body[0].startBlock ).to.Number();
        expect( res.body[0].transfersCount ).to.Number();
        expect( res.body[0].deploysCount ).to.Number();
        expect( res.body[0].start ).to.String();
        expect( res.body[0].circulatingSupply ).to.Number();
        expect( res.body[0].validatorsWeights ).to.Number();
        expect( res.body[0].totalSupply ).to.Number();
        expect( res.body[0].validatorsRewards ).to.Number();
        expect( res.body[0].delegatorsRewards ).to.Number();
        expect( res.body[0].rewards ).to.Number();
        expect( res.body[0].validatorsCount ).to.Number();
        expect( res.body[0].delegatorsCount ).to.Number();
        expect( res.body[0].stakedThisEra ).to.Number();
        expect( res.body[0].undelegatedThisEra ).to.Number();
        expect( res.body[0].stakedDiffThisEra ).to.Number();
        expect( res.body[0].stakedDiffSinceGenesis ).to.Number();
    } );
} );
