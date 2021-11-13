"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_helper_1 = require("./test-helper");
describe('HomePage', () => {
    let app;
    let client;
    before('setupApplication', async () => {
        ({ app, client } = await test_helper_1.setupApplication());
    });
    after(async () => {
        await app.stop();
    });
    it('exposes explorer page', async () => {
        await client
            .get('/explorer/')
            .expect(200)
            .expect('Content-Type', /text\/html/)
            .expect(/<title>Casper Metrics API/);
    });
    it('have swagger css files', async () => {
        await client
            .get('/css/swagger.css')
            .expect(200)
            .expect('Content-Type', /text\/css/)
            .expect(/.swagger-ui/);
    });
    it('have swagger js files', async () => {
        await client
            .get('/explorer/swagger-ui-bundle.js')
            .expect(200);
        await client
            .get('/explorer/swagger-ui-standalone-preset.js')
            .expect(200);
    });
});
//# sourceMappingURL=home-page.acceptance.js.map