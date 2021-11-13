"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerService = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@loopback/core");
const logger_1 = require("../logger");
const casper_client_sdk_1 = require("casper-client-sdk");
const environment_1 = require("../environments/environment");
const repository_1 = require("@loopback/repository");
const repositories_1 = require("../repositories");
const await_timeout_1 = tslib_1.__importDefault(require("await-timeout"));
const client_js_1 = require("@open-rpc/client-js");
const redis_service_1 = require("./redis.service");
const moment_1 = tslib_1.__importDefault(require("moment"));
const circulating_service_1 = require("./circulating.service");
let CrawlerService = class CrawlerService {
    constructor(eraRepository, blocksRepository, transferRepository, knownAccountRepository, redisService, circulatingService) {
        this.eraRepository = eraRepository;
        this.blocksRepository = blocksRepository;
        this.transferRepository = transferRepository;
        this.knownAccountRepository = knownAccountRepository;
        this.redisService = redisService;
        this.circulatingService = circulatingService;
        this._casperServices = [];
        this._minRpcNodes = 5;
        logger_1.logger.info('Service init.');
    }
    async getLastBlockHeight() {
        this._casperServices = [];
        logger_1.logger.info('Trying to init %d nodes', environment_1.environment.rpc_nodes.length);
        for (const node of environment_1.environment.rpc_nodes) {
            const casperServiceSet = {
                node: new casper_client_sdk_1.CasperServiceByJsonRPC('http://' + node + ':7777/rpc'),
                ip: node
            };
            let blockInfo;
            try {
                blockInfo = await this._getLastBlockWithTimeout(casperServiceSet.node);
            }
            catch (error) {
                logger_1.logger.warn('Failed to init Casper Node %s', node);
                logger_1.logger.warn(error);
                environment_1.environment.rpc_nodes.splice(environment_1.environment.rpc_nodes.indexOf(node), 1);
                continue;
            }
            try {
                casperServiceSet.lastBlock = blockInfo.block.header.height;
            }
            catch (error) {
                environment_1.environment.rpc_nodes.splice(environment_1.environment.rpc_nodes.indexOf(node), 1);
                continue;
            }
            this._casperServices.push(casperServiceSet);
        }
        const maxLastBlock = Math.max.apply(Math, this._casperServices.map((node) => {
            return node.lastBlock || 0;
        }));
        this._casperServices = this._casperServices.filter(node => node.lastBlock === maxLastBlock);
        if (this._casperServices.length < this._minRpcNodes) {
            return await this.getLastBlockHeight();
        }
        logger_1.logger.info('Launched %d Casper Services - last block %d', this._casperServices.length, maxLastBlock);
        return maxLastBlock;
    }
    async createBlock(blockHeight) {
        var _a, _b;
        if (await this.blocksRepository.exists(blockHeight)) {
            logger_1.logger.warn('Block %d already exists', blockHeight);
            await this.blocksRepository.deleteById(blockHeight);
        }
        const blockInfo = await this._casperService().getBlockInfoByHeight(blockHeight);
        const stateRootHash = blockInfo.block.header.state_root_hash;
        const totalSupply = await this._getTotalSupply(stateRootHash);
        let deploys = 0;
        let transfers = 0;
        let staked = {
            amount: BigInt(0),
            delegated: BigInt(0),
            undelegated: BigInt(0),
        };
        if ((_a = blockInfo.block.body.deploy_hashes) === null || _a === void 0 ? void 0 : _a.length) {
            deploys = blockInfo.block.body.deploy_hashes.length;
            staked = await this._processDeploys(blockInfo.block.body.deploy_hashes);
        }
        if ((_b = blockInfo.block.body.transfer_hashes) === null || _b === void 0 ? void 0 : _b.length) {
            transfers = blockInfo.block.body.transfer_hashes.length;
            await this._processTransfers(blockInfo.block.body.transfer_hashes, blockHeight);
        }
        const eraId = blockInfo.block.header.era_id;
        let isSwitchBlock = false;
        let nextEraValidatorsWeights = BigInt(0);
        let validatorsSum = BigInt(0);
        let validatorsCount = 0;
        let delegatorsSum = BigInt(0);
        let delegatorsCount = 0;
        if (blockInfo.block.header.era_end) {
            isSwitchBlock = true;
            nextEraValidatorsWeights = this._denominate(await this._getValidatorsWeights(blockInfo.block.header.era_end.next_era_validator_weights));
            const transport = new client_js_1.HTTPTransport('http://' + this._getRandomNodeIP() + ':7777/rpc');
            const client = new client_js_1.Client(new client_js_1.RequestManager([transport]));
            const result = await client.request({
                method: 'chain_get_era_info_by_switch_block',
                params: {
                    block_identifier: {
                        Hash: blockInfo.block.hash
                    }
                }
            });
            const allocations = result.era_summary.stored_value.EraInfo.seigniorage_allocations;
            // TODO: count unique
            allocations.forEach((allocation) => {
                if (allocation.Validator) {
                    validatorsCount++;
                    validatorsSum += BigInt(allocation.Validator.amount);
                }
                if (allocation.Delegator) {
                    delegatorsCount++;
                    delegatorsSum += BigInt(allocation.Delegator.amount);
                }
            });
        }
        await this.blocksRepository.create({
            blockHeight: blockHeight,
            eraId: eraId,
            timestamp: blockInfo.block.header.timestamp,
            stateRootHash: stateRootHash,
            totalSupply: this._denominate(totalSupply),
            stakedThisBlock: this._denominate(staked.delegated),
            undelegatedThisBlock: this._denominate(staked.undelegated),
            stakedDiffThisBlock: this._denominate(staked.amount),
            nextEraValidatorsWeights: nextEraValidatorsWeights,
            validatorsRewards: this._denominate(validatorsSum),
            delegatorsRewards: this._denominate(delegatorsSum),
            validatorsCount: validatorsCount,
            delegatorsCount: delegatorsCount,
            rewards: this._denominate(validatorsSum + delegatorsSum),
            switch: isSwitchBlock,
            circulatingSupply: BigInt(0),
            validatorsWeights: BigInt(0),
            stakedDiffSinceGenesis: BigInt(0),
            deploysCount: deploys,
            transfersCount: transfers,
        });
        await this.redisService.client.setAsync('b' + String(blockHeight), 1);
    }
    async calcBlocksAndEras() {
        logger_1.logger.info('Calculation started.');
        await this.redisService.client.setAsync('calculating', 1);
        const lastCalculated = Number(await this.redisService.client.getAsync('lastcalc'));
        const blocks = await this.blocksRepository.find({
            where: { blockHeight: { gt: lastCalculated || -1 } }
        });
        let era;
        let blockCount = 0;
        for (const block of blocks) {
            const blockTransfers = await this.transferRepository.find({
                where: {
                    blockHeight: block.blockHeight
                }
            });
            for (const transfer of blockTransfers) {
                let depth = 0;
                if (environment_1.environment.locked_wallets.includes(transfer.from.toUpperCase())) {
                    depth = 1;
                }
                else {
                    const foundTransfer = await this.transferRepository.findOne({
                        where: {
                            toHash: transfer.fromHash,
                            and: [
                                {
                                    depth: {
                                        lt: 3,
                                    },
                                },
                                {
                                    depth: {
                                        gt: 0,
                                    },
                                },
                            ]
                        },
                        order: ['depth ASC'],
                        fields: ['depth'],
                    });
                    if (foundTransfer) {
                        depth = foundTransfer.depth + 1;
                    }
                }
                if (depth) {
                    transfer.depth = depth;
                    /* Try to find find hex address for "to" account */
                    if (!transfer.to) {
                        const knownAccount = await this.knownAccountRepository.findOne({
                            where: {
                                hash: transfer.toHash,
                                hex: {
                                    neq: ''
                                }
                            }
                        }).catch(() => { });
                        if (knownAccount) {
                            transfer.to = knownAccount.hex;
                        }
                    }
                    await this.transferRepository.updateById(transfer.id, transfer);
                }
            }
            let prevDiff = BigInt(0);
            let prevBlock = null;
            if (block.blockHeight > 0) {
                if (blockCount > 0) {
                    prevBlock = blocks[blockCount - 1];
                }
                else {
                    prevBlock = await this.blocksRepository.findById(block.blockHeight - 1);
                }
                prevDiff = BigInt(prevBlock.stakedDiffSinceGenesis);
            }
            else {
                await this._createGenesisEra(block);
                era = await this.eraRepository.findById(block.eraId);
            }
            if (prevBlock && prevBlock.switch) {
                await this._createNewEra(prevBlock, block);
                const completedEra = await this.eraRepository.findById(prevBlock.eraId);
                let eraBlocks = blocks.filter(eraBlock => eraBlock.eraId === (prevBlock === null || prevBlock === void 0 ? void 0 : prevBlock.eraId));
                if (!eraBlocks.some(eraBlock => eraBlock.blockHeight === completedEra.startBlock)) {
                    eraBlocks = await this.blocksRepository.find({
                        where: {
                            eraId: completedEra.id
                        }
                    });
                }
                await this._updateCompletedEra(prevBlock, eraBlocks);
            }
            if (!era || era.id !== block.eraId) {
                era = await this.eraRepository.findById(block.eraId);
            }
            blockCount++;
        }
        await this.redisService.client.setAsync('lastcalc', blocks[blocks.length - 1].blockHeight);
        await this.redisService.client.setAsync('calculating', 0);
        logger_1.logger.info('Calculation finished.');
    }
    _casperService() {
        return this._casperServices[Math.floor(Math.random() * this._casperServices.length)].node;
    }
    _getRandomNodeIP() {
        return this._casperServices[Math.floor(Math.random() * this._casperServices.length)].ip;
    }
    async _getLastBlockWithTimeout(node) {
        const timer = new await_timeout_1.default();
        try {
            return await Promise.race([
                node.getLatestBlockInfo(),
                timer.set(3000, 'Timeout')
            ]);
        }
        finally {
            timer.clear();
        }
    }
    async _createNewEra(prevBlock, block) {
        if (!await this.eraRepository.exists(block.eraId)) {
            await this.eraRepository.create({
                id: block.eraId,
                stakedDiffSinceGenesis: block.stakedDiffSinceGenesis,
                circulatingSupply: BigInt(block.circulatingSupply),
                startBlock: block.blockHeight,
                start: block.timestamp,
                validatorsWeights: prevBlock.nextEraValidatorsWeights,
                totalSupply: block.totalSupply,
                stakedDiffThisEra: BigInt(0),
                stakedThisEra: BigInt(0),
                undelegatedThisEra: BigInt(0),
                validatorsRewards: BigInt(0),
                delegatorsRewards: BigInt(0),
                validatorsCount: 0,
                delegatorsCount: 0,
                rewards: BigInt(0),
                deploysCount: 0,
                transfersCount: 0,
            });
        }
        await this.circulatingService.updateEraCirculatingSupply(await this.eraRepository.findById(block.eraId));
    }
    async _updateCompletedEra(switchBlock, eraBlocks) {
        let stakedInfo = {
            amount: BigInt(0),
            delegated: BigInt(0),
            undelegated: BigInt(0),
        };
        let deploys = 0;
        let transfers = 0;
        let validatorsCount = 0;
        let delegatorsCount = 0;
        let rewards = BigInt(0);
        let delegatorsRewards = BigInt(0);
        let validatorsRewards = BigInt(0);
        for (const eraBlock of eraBlocks) {
            stakedInfo.amount += BigInt(eraBlock.stakedDiffThisBlock);
            stakedInfo.delegated += BigInt(eraBlock.stakedThisBlock);
            stakedInfo.undelegated += BigInt(eraBlock.undelegatedThisBlock);
            deploys += eraBlock.deploysCount;
            transfers += eraBlock.transfersCount;
            validatorsRewards += BigInt(eraBlock.validatorsRewards);
            delegatorsRewards += BigInt(eraBlock.delegatorsRewards);
            rewards += BigInt(eraBlock.rewards);
            validatorsCount += eraBlock.validatorsCount;
            delegatorsCount += eraBlock.delegatorsCount;
        }
        await this.eraRepository.updateById(switchBlock.eraId, {
            totalSupply: switchBlock.totalSupply,
            circulatingSupply: BigInt(switchBlock.circulatingSupply),
            stakedDiffSinceGenesis: switchBlock.stakedDiffSinceGenesis,
            endBlock: switchBlock.blockHeight,
            end: moment_1.default(switchBlock.timestamp).add(-1, 'ms').format(),
            stakedDiffThisEra: stakedInfo.amount,
            stakedThisEra: stakedInfo.delegated,
            undelegatedThisEra: stakedInfo.undelegated,
            validatorsRewards: validatorsRewards,
            delegatorsRewards: delegatorsRewards,
            validatorsCount: validatorsCount,
            delegatorsCount: delegatorsCount,
            rewards: rewards,
            deploysCount: deploys,
            transfersCount: transfers,
        });
        if (switchBlock.eraId > 480) {
            await this.circulatingService.updateEraCirculatingSupply(await this.eraRepository.findById(switchBlock.eraId));
        }
    }
    async _createGenesisEra(block) {
        await this.eraRepository.create({
            id: 0,
            stakedDiffSinceGenesis: BigInt(0),
            circulatingSupply: BigInt(0),
            stakedDiffThisEra: BigInt(0),
            undelegatedThisEra: BigInt(0),
            stakedThisEra: BigInt(0),
            startBlock: 0,
            start: block.timestamp,
            validatorsWeights: BigInt(environment_1.environment.genesis_validators_weights_total),
            validatorsRewards: BigInt(0),
            delegatorsRewards: BigInt(0),
            validatorsCount: 0,
            delegatorsCount: 0,
            rewards: BigInt(0),
            totalSupply: block.totalSupply,
        });
    }
    async _getTotalSupply(stateRootHash) {
        const blockState = await this._casperService().getBlockState(stateRootHash, environment_1.environment.contract_uref, []).catch(error => {
            logger_1.logger.error(error);
            throw new Error(error);
        });
        return BigInt(blockState.CLValue.value.val);
    }
    async _getValidatorsWeights(weights) {
        let validatorWeights = BigInt(0);
        weights.forEach((item) => {
            validatorWeights += BigInt(item.weight);
        });
        return validatorWeights;
    }
    async _processTransfers(transferHashes, blockHeight) {
        var _a, _b;
        for (const hash of transferHashes) {
            const deployResult = await this._casperService().getDeployInfo(hash);
            for (const executionResult of deployResult.execution_results) {
                if ((_b = (_a = executionResult === null || executionResult === void 0 ? void 0 : executionResult.result) === null || _a === void 0 ? void 0 : _a.Success) === null || _b === void 0 ? void 0 : _b.effect) {
                    for (const transform of executionResult.result.Success.effect.transforms) {
                        if (transform.transform.WriteTransfer &&
                            executionResult.result.Success.transfers.includes(transform.key)) {
                            const transfer = transform.transform.WriteTransfer;
                            let knownHex = '';
                            let knownAccount = await this.knownAccountRepository.findOne({
                                where: {
                                    hash: transfer.to,
                                    hex: {
                                        neq: '',
                                    },
                                }
                            }).catch(() => { });
                            if (knownAccount) {
                                knownHex = knownAccount.hex || '';
                            }
                            knownAccount = await this.knownAccountRepository.findOne({
                                where: {
                                    hash: transfer.from,
                                    hex: {
                                        neq: '',
                                    },
                                }
                            }).catch(() => { });
                            if (!knownAccount) {
                                try {
                                    await this.knownAccountRepository.create({
                                        hash: transfer.from,
                                        hex: deployResult.deploy.header.account,
                                    });
                                }
                                catch (error) {
                                    console.error(error);
                                }
                            }
                            await this.transferRepository.create({
                                timestamp: deployResult.deploy.header.timestamp,
                                blockHeight: blockHeight,
                                depth: 0,
                                deployHash: transfer.deploy_hash,
                                from: deployResult.deploy.header.account,
                                fromHash: transfer.from,
                                toHash: transfer.to,
                                to: knownHex,
                                amount: transfer.amount,
                            });
                        }
                    }
                }
            }
        }
    }
    async _processDeploys(deploy_hashes) {
        var _a, _b, _c, _d;
        let staked = {
            amount: BigInt(0),
            delegated: BigInt(0),
            undelegated: BigInt(0),
        };
        for (const hash of deploy_hashes) {
            const deployResult = await this._casperService().getDeployInfo(hash);
            for (const executionResult of deployResult.execution_results) {
                if (((_a = executionResult === null || executionResult === void 0 ? void 0 : executionResult.result) === null || _a === void 0 ? void 0 : _a.Success) &&
                    ((_d = (_c = (_b = deployResult === null || deployResult === void 0 ? void 0 : deployResult.deploy) === null || _b === void 0 ? void 0 : _b.session) === null || _c === void 0 ? void 0 : _c.ModuleBytes) === null || _d === void 0 ? void 0 : _d.args)) {
                    const args = deployResult.deploy.session.ModuleBytes.args;
                    let isDelegated = false;
                    let isUndelegated = false;
                    let isDelegateOperation = 0;
                    let isAddBid = 0;
                    let isWithdrawBid = 0;
                    let currentAmount = BigInt(0);
                    args.forEach((arg) => {
                        if (['public_key', 'amount', 'delegation_rate'].includes(arg[0])) {
                            isAddBid++;
                        }
                        if (['public_key', 'amount', 'unbond_purse'].includes(arg[0])) {
                            isWithdrawBid++;
                        }
                        if (['validator', 'amount', 'delegator'].includes(arg[0])) {
                            isDelegateOperation++;
                        }
                        if (arg[0] === 'amount') {
                            currentAmount = BigInt(arg[1].parsed);
                        }
                    });
                    if (isDelegateOperation === 3) {
                        if (executionResult.result.Success.effect &&
                            executionResult.result.Success.effect.transforms) {
                            executionResult.result.Success.effect.transforms.forEach((transform) => {
                                if (transform.transform.WriteWithdraw) {
                                    isUndelegated = true;
                                }
                            });
                            if (!isUndelegated) {
                                isDelegated = true;
                            }
                        }
                    }
                    if (isAddBid === 3 || isDelegated) {
                        staked.amount += currentAmount;
                        staked.delegated += currentAmount;
                    }
                    if (isWithdrawBid === 3 || isUndelegated) {
                        staked.amount -= currentAmount;
                        staked.undelegated += currentAmount;
                    }
                }
            }
        }
        return staked;
    }
    _nominate(amount) {
        return amount * BigInt(1000000000);
    }
    _denominate(amount) {
        return amount / BigInt(1000000000);
    }
};
CrawlerService = tslib_1.__decorate([
    core_1.injectable({ scope: core_1.BindingScope.TRANSIENT }),
    tslib_1.__param(0, repository_1.repository(repositories_1.EraRepository)),
    tslib_1.__param(1, repository_1.repository(repositories_1.BlockRepository)),
    tslib_1.__param(2, repository_1.repository(repositories_1.TransferRepository)),
    tslib_1.__param(3, repository_1.repository(repositories_1.KnownAccountRepository)),
    tslib_1.__param(4, core_1.service(redis_service_1.RedisService)),
    tslib_1.__param(5, core_1.service(circulating_service_1.CirculatingService)),
    tslib_1.__metadata("design:paramtypes", [repositories_1.EraRepository,
        repositories_1.BlockRepository,
        repositories_1.TransferRepository,
        repositories_1.KnownAccountRepository,
        redis_service_1.RedisService,
        circulating_service_1.CirculatingService])
], CrawlerService);
exports.CrawlerService = CrawlerService;
//# sourceMappingURL=crawler.service.js.map