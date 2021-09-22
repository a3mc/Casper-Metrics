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

    it( 'invokes GET block/circulating with block id', async () => {
        const res = await client.get( '/block/circulating?blockHeight=1000' ).expect( 200 );
        expect( parseInt( res.text ) ).to.Number();
    } );

    it( 'should return 404 on non-existing block when querying circulating', async () => {
        const res = await client.get( '/block/circulating?blockHeight=10000000000' ).expect( 404 );
    } );

    it( 'invokes GET block/total', async () => {
        const res = await client.get( '/block/total' ).expect( 200 );
        expect( parseInt( res.text ) ).to.Number();
    } );

    it( 'invokes GET block/total with block height', async () => {
        const res = await client.get( '/block/total?blockHeight=1000' ).expect( 200 );
        expect( parseInt( res.text ) ).to.Number();
    } );

    it( 'should return 404 on non-existing block when querying total', async () => {
        const res = await client.get( '/block/circulating?blockHeight=10000000000' ).expect( 404 );
    } );

    it( 'invokes GET block without params - last', async () => {
        const res = await client.get( '/block' ).expect( 200 );
        expect( res.body.blockHeight ).to.Number();
        expect( res.body.transfersCount ).to.Number();
        expect( res.body.deploysCount ).to.Number();
        expect( res.body.circulatingSupply ).to.Number();
        expect( res.body.validatorsWeights ).to.Number();
        expect( res.body.totalSupply ).to.Number();
        expect( res.body.validatorsRewards ).to.Number();
        expect( res.body.delegatorsRewards ).to.Number();
        expect( res.body.rewards ).to.Number();
        expect( res.body.validatorsCount ).to.Number();
        expect( res.body.delegatorsCount ).to.Number();
    } );

    it( 'invokes GET block with block height', async () => {
        const res = await client.get( '/block?blockHeight=1000' ).expect( 200 );
        expect( res.body.blockHeight ).to.Number();
        expect( res.body.transfersCount ).to.Number();
        expect( res.body.deploysCount ).to.Number();
        expect( res.body.circulatingSupply ).to.Number();
        expect( res.body.validatorsWeights ).to.Number();
        expect( res.body.totalSupply ).to.Number();
        expect( res.body.validatorsRewards ).to.Number();
        expect( res.body.delegatorsRewards ).to.Number();
        expect( res.body.rewards ).to.Number();
        expect( res.body.validatorsCount ).to.Number();
        expect( res.body.delegatorsCount ).to.Number();
    } );

    it( 'should return 404 when querying non-existing block', async () => {
        const res = await client.get( '/block?blockHeight=10000000000' ).expect( 404 );
    } );
} );
