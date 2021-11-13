"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testlab_1 = require("@loopback/testlab");
const test_helper_1 = require("./test-helper");
describe('BlockController', () => {
    let app;
    let client;
    before('setupApplication', async () => {
        ({ app, client } = await test_helper_1.setupApplication());
    });
    after(async () => {
        await app.stop();
    });
    it('invokes GET block/circulating', async () => {
        const res = await client.get('/block/circulating').expect(200);
    });
    it('invokes GET block/circulating with block id', async () => {
        const res = await client.get('/block/circulating?blockHeight=1000').expect(200);
        testlab_1.expect(parseInt(res.text)).to.Number();
    });
    it('should return 404 on non-existing block when querying circulating', async () => {
        const res = await client.get('/block/circulating?blockHeight=10000000000').expect(404);
    });
    it('invokes GET block/total', async () => {
        const res = await client.get('/block/total').expect(200);
        testlab_1.expect(parseInt(res.text)).to.Number();
    });
    it('invokes GET block/total with block height', async () => {
        const res = await client.get('/block/total?blockHeight=1000').expect(200);
        testlab_1.expect(parseInt(res.text)).to.Number();
    });
    it('should return 404 on non-existing block when querying total', async () => {
        const res = await client.get('/block/circulating?blockHeight=10000000000').expect(404);
    });
    it('invokes GET block without params - last', async () => {
        const res = await client.get('/block').expect(200);
        testlab_1.expect(res.body.blockHeight).to.Number();
        testlab_1.expect(res.body.transfersCount).to.Number();
        testlab_1.expect(res.body.deploysCount).to.Number();
        testlab_1.expect(res.body.circulatingSupply).to.Number();
        testlab_1.expect(res.body.validatorsWeights).to.Number();
        testlab_1.expect(res.body.totalSupply).to.Number();
        testlab_1.expect(res.body.validatorsRewards).to.Number();
        testlab_1.expect(res.body.delegatorsRewards).to.Number();
        testlab_1.expect(res.body.rewards).to.Number();
        testlab_1.expect(res.body.validatorsCount).to.Number();
        testlab_1.expect(res.body.delegatorsCount).to.Number();
    });
    it('invokes GET block with block height', async () => {
        const res = await client.get('/block?blockHeight=1000').expect(200);
        testlab_1.expect(res.body.blockHeight).to.Number();
        testlab_1.expect(res.body.transfersCount).to.Number();
        testlab_1.expect(res.body.deploysCount).to.Number();
        testlab_1.expect(res.body.circulatingSupply).to.Number();
        testlab_1.expect(res.body.validatorsWeights).to.Number();
        testlab_1.expect(res.body.totalSupply).to.Number();
        testlab_1.expect(res.body.validatorsRewards).to.Number();
        testlab_1.expect(res.body.delegatorsRewards).to.Number();
        testlab_1.expect(res.body.rewards).to.Number();
        testlab_1.expect(res.body.validatorsCount).to.Number();
        testlab_1.expect(res.body.delegatorsCount).to.Number();
    });
    it('should return 404 when querying non-existing block', async () => {
        const res = await client.get('/block?blockHeight=10000000000').expect(404);
    });
});
//# sourceMappingURL=block.controller.acceptance.js.map