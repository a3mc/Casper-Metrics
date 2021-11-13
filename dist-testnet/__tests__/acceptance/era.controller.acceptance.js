"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testlab_1 = require("@loopback/testlab");
const test_helper_1 = require("./test-helper");
describe('EraController', () => {
    let app;
    let client;
    before('setupApplication', async () => {
        ({ app, client } = await test_helper_1.setupApplication());
    });
    after(async () => {
        await app.stop();
    });
    it('invokes GET era/circulating', async () => {
        const res = await client.get('/era/circulating').expect(200);
        testlab_1.expect(parseInt(res.text)).to.Number();
    });
    it('invokes GET era/circulating with era id', async () => {
        const res = await client.get('/era/circulating?eraId=1000').expect(200);
    });
    it('should return 404 on non-existing era when querying circulating', async () => {
        const res = await client.get('/era/circulating?eraId=10000000000').expect(404);
    });
    it('invokes GET era/total', async () => {
        const res = await client.get('/era/total').expect(200);
    });
    it('invokes GET era/total with era id', async () => {
        const res = await client.get('/era/total?eraId=1000').expect(200);
    });
    it('should return 404 on non-existing era when querying total', async () => {
        const res = await client.get('/era/total?eraId=10000000000').expect(404);
    });
    it('invokes GET era', async () => {
        const res = await client.get('/era').expect(200);
        testlab_1.expect(res.body[0].id).to.Number();
        testlab_1.expect(res.body[0].startBlock).to.Number();
        testlab_1.expect(res.body[0].transfersCount).to.Number();
        testlab_1.expect(res.body[0].deploysCount).to.Number();
        testlab_1.expect(res.body[0].start).to.String();
        testlab_1.expect(res.body[0].circulatingSupply).to.Number();
        testlab_1.expect(res.body[0].validatorsWeights).to.Number();
        testlab_1.expect(res.body[0].totalSupply).to.Number();
        testlab_1.expect(res.body[0].validatorsRewards).to.Number();
        testlab_1.expect(res.body[0].delegatorsRewards).to.Number();
        testlab_1.expect(res.body[0].rewards).to.Number();
        testlab_1.expect(res.body[0].validatorsCount).to.Number();
        testlab_1.expect(res.body[0].delegatorsCount).to.Number();
        testlab_1.expect(res.body[0].stakedThisEra).to.Number();
        testlab_1.expect(res.body[0].undelegatedThisEra).to.Number();
        testlab_1.expect(res.body[0].stakedDiffThisEra).to.Number();
        testlab_1.expect(res.body[0].stakedDiffSinceGenesis).to.Number();
    });
    it('invokes GET era with era id', async () => {
        const res = await client.get('/era?id=1000').expect(200);
        testlab_1.expect(res.body[0].id).to.Number();
        testlab_1.expect(res.body[0].startBlock).to.Number();
        testlab_1.expect(res.body[0].transfersCount).to.Number();
        testlab_1.expect(res.body[0].deploysCount).to.Number();
        testlab_1.expect(res.body[0].start).to.String();
        testlab_1.expect(res.body[0].circulatingSupply).to.Number();
        testlab_1.expect(res.body[0].validatorsWeights).to.Number();
        testlab_1.expect(res.body[0].totalSupply).to.Number();
        testlab_1.expect(res.body[0].validatorsRewards).to.Number();
        testlab_1.expect(res.body[0].delegatorsRewards).to.Number();
        testlab_1.expect(res.body[0].rewards).to.Number();
        testlab_1.expect(res.body[0].validatorsCount).to.Number();
        testlab_1.expect(res.body[0].delegatorsCount).to.Number();
        testlab_1.expect(res.body[0].stakedThisEra).to.Number();
        testlab_1.expect(res.body[0].undelegatedThisEra).to.Number();
        testlab_1.expect(res.body[0].stakedDiffThisEra).to.Number();
        testlab_1.expect(res.body[0].stakedDiffSinceGenesis).to.Number();
    });
    it('should return empty array on non-existing era id when querying era objects', async () => {
        const res = await client.get('/era?id=10000000000').expect(200);
        testlab_1.expect(res.body).empty();
    });
    it('invokes GET era by block height', async () => {
        const res = await client.get('/era?blockHeight=1000').expect(200);
        testlab_1.expect(res.body).not.empty();
    });
    it('should return empty array on non-existing block height', async () => {
        // Very high block will still return the last era as it's not closed yet.
        const res = await client.get('/era?blockHeight=-1').expect(200);
        testlab_1.expect(res.body).empty();
    });
    it('should accept correct timestamp', async () => {
        const res = await client.get('/era?timestamp=2021-04-01T09%3A03%3A06.000Z').expect(200);
    });
    it('should not accept incorrect timestamp', async () => {
        const res = await client.get('/era?timestamp=INVALID123').expect(400);
    });
    it('should return last 5 eras, sorted by id desc', async () => {
        const res = await client.get('/era?limit=5&order=id%20DESC').expect(200);
        testlab_1.expect(res.body.length).to.equal(5);
        testlab_1.expect(res.body[0].id > res.body[1].id).to.true();
        testlab_1.expect(res.body[1].id > res.body[2].id).to.true();
        testlab_1.expect(res.body[2].id > res.body[3].id).to.true();
        testlab_1.expect(res.body[3].id > res.body[4].id).to.true();
    });
    it('should return first 3 eras, sorted by id asc', async () => {
        const res = await client.get('/era?limit=3&order=id%20ASC').expect(200);
        testlab_1.expect(res.body.length).to.equal(3);
        testlab_1.expect(res.body[0].id < res.body[1].id).to.true();
        testlab_1.expect(res.body[1].id < res.body[2].id).to.true();
    });
});
//# sourceMappingURL=era.controller.acceptance.js.map