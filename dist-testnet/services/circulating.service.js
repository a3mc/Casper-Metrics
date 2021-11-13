"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CirculatingService = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@loopback/core");
const repository_1 = require("@loopback/repository");
const repositories_1 = require("../repositories");
const moment_1 = tslib_1.__importDefault(require("moment"));
const environment_1 = require("../environments/environment");
let CirculatingService = class CirculatingService {
    constructor(eraRepository, blocksRepository, transferRepository, validatorsUnlockRepository, circulatingRepository) {
        this.eraRepository = eraRepository;
        this.blocksRepository = blocksRepository;
        this.transferRepository = transferRepository;
        this.validatorsUnlockRepository = validatorsUnlockRepository;
        this.circulatingRepository = circulatingRepository;
    }
    async calculateCirculatingSupply() {
        const eras = await this.eraRepository.find({
            fields: ['id', 'start', 'end', 'totalSupply']
        });
        for (const era of eras) {
            await this.updateEraCirculatingSupply(era);
        }
    }
    async updateEraCirculatingSupply(era) {
        let circulatingSupply = BigInt(0);
        const approvedUnlocks = await this.circulatingRepository.find({
            where: {
                timestamp: {
                    lte: era.end || moment_1.default(era.start).add(2, 'hours').toISOString()
                }
            }
        });
        circulatingSupply += approvedUnlocks.reduce((a, b) => {
            return a + BigInt(b.unlock);
        }, BigInt(0));
        const unlockedValidators = await this.validatorsUnlockRepository.find({
            where: {
                and: [
                    { day: { gte: 0 } },
                    {
                        timestamp: {
                            lte: era.end ? era.end : moment_1.default(era.start).add(2, 'hours').toISOString()
                        }
                    }
                ]
            }
        });
        circulatingSupply += unlockedValidators.reduce((a, b) => {
            return BigInt(a) + BigInt(b.amount);
        }, BigInt(0));
        const allRewards = Number(era.totalSupply) - environment_1.environment.genesis_total_supply;
        let circulatingSupplyDenominated = Number(circulatingSupply / BigInt(1000000000));
        const releasedRewards = allRewards * (circulatingSupplyDenominated / environment_1.environment.genesis_total_supply);
        circulatingSupplyDenominated += releasedRewards;
        await this.eraRepository.updateById(era.id, {
            circulatingSupply: BigInt(Math.round(circulatingSupplyDenominated))
        });
    }
};
CirculatingService = tslib_1.__decorate([
    core_1.injectable({ scope: core_1.BindingScope.TRANSIENT }),
    tslib_1.__param(0, repository_1.repository(repositories_1.EraRepository)),
    tslib_1.__param(1, repository_1.repository(repositories_1.BlockRepository)),
    tslib_1.__param(2, repository_1.repository(repositories_1.TransferRepository)),
    tslib_1.__param(3, repository_1.repository(repositories_1.ValidatorsUnlockRepository)),
    tslib_1.__param(4, repository_1.repository(repositories_1.CirculatingRepository)),
    tslib_1.__metadata("design:paramtypes", [repositories_1.EraRepository,
        repositories_1.BlockRepository,
        repositories_1.TransferRepository,
        repositories_1.ValidatorsUnlockRepository,
        repositories_1.CirculatingRepository])
], CirculatingService);
exports.CirculatingService = CirculatingService;
//# sourceMappingURL=circulating.service.js.map