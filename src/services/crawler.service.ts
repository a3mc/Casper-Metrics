import { BindingScope, injectable, service } from '@loopback/core';
import { logger } from '../logger';
import { CasperServiceByJsonRPC, PublicKey } from 'casper-client-sdk';
import { BlockStakeInfo } from '../controllers';
import { Block, Era, Transfer } from '../models';
import { environment } from '../environments/environment';
import { repository } from '@loopback/repository';
import {
    BlockRepository,
    EraRepository,
    KnownAccountRepository,
    TransferRepository
} from '../repositories';
import Timeout from 'await-timeout';
import { Client, HTTPTransport, RequestManager } from '@open-rpc/client-js';
import { RedisService } from './redis.service';
import moment from 'moment';
import { CirculatingService } from "./circulating.service";

export interface CasperServiceSet {
    lastBlock?: number;
    node: CasperServiceByJsonRPC;
    ip: string;
}

@injectable( { scope: BindingScope.TRANSIENT } )
export class CrawlerService {
    private _casperServices: CasperServiceSet[] = [];
    private _minRpcNodes = 5;

    constructor(
        @repository( EraRepository ) public eraRepository: EraRepository,
        @repository( BlockRepository ) public blocksRepository: BlockRepository,
        @repository( TransferRepository ) public transferRepository: TransferRepository,
        @repository( KnownAccountRepository ) public knownAccountRepository: KnownAccountRepository,
        @service( RedisService ) public redisService: RedisService,
        @service( CirculatingService ) public circulatingService: CirculatingService,
    ) {
        logger.info( 'Service init.' );
    }

    public async getLastBlockHeight(): Promise<number> {
        this._casperServices = [];
        logger.info( 'Trying to init %d nodes', environment.rpc_nodes.length );
        for ( const node of environment.rpc_nodes ) {
            const casperServiceSet: CasperServiceSet = {
                node: new CasperServiceByJsonRPC(
                    'http://' + node + ':7777/rpc'
                ),
                ip: node
            };
            let blockInfo;
            try {
                blockInfo = await this._getLastBlockWithTimeout( casperServiceSet.node )
            } catch ( error ) {
                logger.warn( 'Failed to init Casper Node %s', node );
                logger.warn( error );
                environment.rpc_nodes.splice( environment.rpc_nodes.indexOf( node ), 1 );
                continue;
            }

            try {
                casperServiceSet.lastBlock = blockInfo.block.header.height;
            } catch ( error ) {
                environment.rpc_nodes.splice( environment.rpc_nodes.indexOf( node ), 1 );
                continue;
            }
            this._casperServices.push( casperServiceSet );
        }

        const maxLastBlock = Math.max.apply( Math, this._casperServices.map( ( node: CasperServiceSet ) => {
            return node.lastBlock || 0;
        } ) );

        this._casperServices = this._casperServices.filter(
            node => node.lastBlock === maxLastBlock
        );

        if ( this._casperServices.length < this._minRpcNodes ) {
            return await this.getLastBlockHeight();
        }

        logger.info(
            'Launched %d Casper Services - last block %d',
            this._casperServices.length,
            maxLastBlock
        );
        return maxLastBlock;
    }

    public async createBlock( blockHeight: number ): Promise<void> {
        if ( await this.blocksRepository.exists( blockHeight ) ) {
            logger.warn( 'Block %d already exists', blockHeight );
            await this.blocksRepository.deleteById( blockHeight );
        }

        const blockInfo: any = await this._casperService().getBlockInfoByHeight( blockHeight );
        const stateRootHash: string = blockInfo.block.header.state_root_hash;
        const totalSupply: bigint = await this._getTotalSupply( stateRootHash );
        let deploys = 0;
        let transfers = 0;
        let staked: BlockStakeInfo = {
            amount: BigInt( 0 ),
            delegated: BigInt( 0 ),
            undelegated: BigInt( 0 ),
        }
        if ( blockInfo.block.body.deploy_hashes?.length ) {
            deploys = blockInfo.block.body.deploy_hashes.length;
            staked = await this._processDeploys( blockInfo.block.body.deploy_hashes );
        }

        if ( blockInfo.block.body.transfer_hashes?.length ) {
            transfers = blockInfo.block.body.transfer_hashes.length
            await this._processTransfers( blockInfo.block.body.transfer_hashes, blockHeight );
        }

        const eraId: number = blockInfo.block.header.era_id;
        let isSwitchBlock = false;
        let nextEraValidatorsWeights = BigInt( 0 );
        let validatorsSum = BigInt( 0 );
        let validatorsCount = 0;
        let delegatorsSum = BigInt( 0 );
        let delegatorsCount = 0;

        if ( blockInfo.block.header.era_end ) {
            isSwitchBlock = true;
            nextEraValidatorsWeights = this._denominate( await this._getValidatorsWeights(
                blockInfo.block.header.era_end.next_era_validator_weights
            ) );

            const transport = new HTTPTransport(
                'http://' + this._getRandomNodeIP() + ':7777/rpc'
            );
            const client = new Client( new RequestManager( [transport] ) );

            const result = await client.request( {
                method: 'chain_get_era_info_by_switch_block',
                params: {
                    block_identifier: {
                        Hash: blockInfo.block.hash
                    }
                }
            } );
            const allocations = result.era_summary.stored_value.EraInfo.seigniorage_allocations;

            // TODO: count unique
            allocations.forEach( ( allocation: any ) => {
                if ( allocation.Validator ) {
                    validatorsCount++;
                    validatorsSum += BigInt( allocation.Validator.amount );
                }
                if ( allocation.Delegator ) {
                    delegatorsCount++;
                    delegatorsSum += BigInt( allocation.Delegator.amount );
                }
            } );
        }

        await this.blocksRepository.create( {
            blockHeight: blockHeight,
            eraId: eraId,
            timestamp: blockInfo.block.header.timestamp,
            stateRootHash: stateRootHash,
            totalSupply: this._denominate( totalSupply ),
            stakedThisBlock: this._denominate( staked.delegated ),
            undelegatedThisBlock: this._denominate( staked.undelegated ),
            stakedDiffThisBlock: this._denominate( staked.amount ),
            nextEraValidatorsWeights: nextEraValidatorsWeights,
            validatorsRewards: this._denominate( validatorsSum ),
            delegatorsRewards: this._denominate( delegatorsSum ),
            validatorsCount: validatorsCount,
            delegatorsCount: delegatorsCount,
            rewards: this._denominate( validatorsSum + delegatorsSum ),
            switch: isSwitchBlock,
            circulatingSupply: BigInt( 0 ),
            validatorsWeights: BigInt( 0 ),
            stakedDiffSinceGenesis: BigInt( 0 ),
            deploysCount: deploys,
            transfersCount: transfers,
        } );

        await this.redisService.client.setAsync( 'b' + String( blockHeight ), 1 );
    }

    public async calcBlocksAndEras(): Promise<void> {
        logger.info( 'Calculation started.' );
        await this.redisService.client.setAsync( 'calculating', 1 );

        const lastCalculated: number = Number( await this.redisService.client.getAsync( 'lastcalc' ) );
        const blocks: Block[] = await this.blocksRepository.find( {
            where: { blockHeight: { gt: lastCalculated || -1 } }
        } );

        let era;
        let blockCount = 0;
        for ( const block of blocks ) {
            const blockTransfers: Transfer[] = await this.transferRepository.find( {
                where: {
                    blockHeight: block.blockHeight
                }
            } );

            for ( const transfer of blockTransfers ) {
                let depth = 0;
                if ( environment.locked_wallets.includes( transfer.from.toUpperCase() ) ) {
                    depth = 1;
                } else {
                    const foundTransfer: Transfer | null | void = await this.transferRepository.findOne( {
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
                    } );

                    if ( foundTransfer ) {
                        depth = foundTransfer.depth + 1;
                    }
                }
                if ( depth ) {
                    transfer.depth = depth;
                    /* Try to find find hex address for "to" account */
                    if ( !transfer.to ) {
                        const knownAccount = await this.knownAccountRepository.findOne( {
                            where: {
                                hash: transfer.toHash,
                                hex: {
                                    neq: ''
                                }
                            }
                        } ).catch( () => {});
                        if ( knownAccount ) {
                            transfer.to = knownAccount.hex;
                        }
                    }

                    await this.transferRepository.updateById( transfer.id, transfer );
                }
            }

            let prevDiff = BigInt( 0 );
            let prevBlock: Block | null = null;
            if ( block.blockHeight > 0 ) {
                if ( blockCount > 0 ) {
                    prevBlock = blocks[blockCount - 1];
                } else {
                    prevBlock = await this.blocksRepository.findById( block.blockHeight - 1 );
                }
                prevDiff = BigInt( prevBlock.stakedDiffSinceGenesis );
            } else {
                await this._createGenesisEra( block );
                era = await this.eraRepository.findById( block.eraId );
            }

            if ( prevBlock && prevBlock.switch ) {
                await this._createNewEra( prevBlock, block );

                const completedEra: Era = await this.eraRepository.findById( prevBlock.eraId );
                let eraBlocks: Block[] = blocks.filter( eraBlock => eraBlock.eraId === prevBlock?.eraId );
                if ( !eraBlocks.some( eraBlock => eraBlock.blockHeight === completedEra.startBlock ) ) {
                    eraBlocks = await this.blocksRepository.find( {
                        where: {
                            eraId: completedEra.id
                        }
                    } )
                }
                await this._updateCompletedEra( prevBlock, eraBlocks );
            }

            if ( !era || era.id !== block.eraId ) {
                era = await this.eraRepository.findById( block.eraId );
            }
            blockCount++;
        }
        await this.redisService.client.setAsync( 'lastcalc', blocks[blocks.length - 1].blockHeight );
        await this.redisService.client.setAsync( 'calculating', 0 );
        logger.info( 'Calculation finished.' );
    }

    private _casperService(): CasperServiceByJsonRPC {
        return this._casperServices[Math.floor( Math.random() * this._casperServices.length )].node;
    }

    private _getRandomNodeIP(): string {
        return this._casperServices[Math.floor( Math.random() * this._casperServices.length )].ip;
    }

    private async _getLastBlockWithTimeout( node: CasperServiceByJsonRPC ): Promise<any> {
        const timer = new Timeout();
        try {
            return await Promise.race( [
                node.getLatestBlockInfo(),
                timer.set( 3000, 'Timeout' )
            ] );
        } finally {
            timer.clear();
        }
    }

    private async _createNewEra( prevBlock: Block, block: Block ): Promise<void> {
        if ( !await this.eraRepository.exists( block.eraId ) ) {
            await this.eraRepository.create( {
                id: block.eraId,
                stakedDiffSinceGenesis: block.stakedDiffSinceGenesis,
                circulatingSupply: BigInt( block.circulatingSupply ),
                startBlock: block.blockHeight,
                start: block.timestamp,
                validatorsWeights: prevBlock.nextEraValidatorsWeights,
                totalSupply: block.totalSupply,
                stakedDiffThisEra: BigInt( 0 ),
                stakedThisEra: BigInt( 0 ),
                undelegatedThisEra: BigInt( 0 ),
                validatorsRewards: BigInt( 0 ),
                delegatorsRewards: BigInt( 0 ),
                validatorsCount: 0,
                delegatorsCount: 0,
                rewards: BigInt( 0 ),
                deploysCount: 0,
                transfersCount: 0,
            } );
        }
        await this.circulatingService.updateEraCirculatingSupply(
            await this.eraRepository.findById( block.eraId )
        );
    }

    private async _updateCompletedEra( switchBlock: Block, eraBlocks: Block[] ): Promise<void> {
        let stakedInfo: BlockStakeInfo = {
            amount: BigInt( 0 ),
            delegated: BigInt( 0 ),
            undelegated: BigInt( 0 ),
        }
        let deploys = 0;
        let transfers = 0;
        let validatorsCount = 0;
        let delegatorsCount = 0;
        let rewards = BigInt( 0 );
        let delegatorsRewards = BigInt( 0 );
        let validatorsRewards = BigInt( 0 );
        for ( const eraBlock of eraBlocks ) {
            stakedInfo.amount += BigInt( eraBlock.stakedDiffThisBlock );
            stakedInfo.delegated += BigInt( eraBlock.stakedThisBlock );
            stakedInfo.undelegated += BigInt( eraBlock.undelegatedThisBlock );

            deploys += eraBlock.deploysCount;
            transfers += eraBlock.transfersCount;
            validatorsRewards += BigInt( eraBlock.validatorsRewards );
            delegatorsRewards += BigInt( eraBlock.delegatorsRewards );
            rewards += BigInt( eraBlock.rewards );
            validatorsCount += eraBlock.validatorsCount;
            delegatorsCount += eraBlock.delegatorsCount;
        }

        await this.eraRepository.updateById(
            switchBlock.eraId,
            {
                totalSupply: switchBlock.totalSupply,
                circulatingSupply: BigInt( switchBlock.circulatingSupply ),
                stakedDiffSinceGenesis: switchBlock.stakedDiffSinceGenesis,
                endBlock: switchBlock.blockHeight,
                end: moment( switchBlock.timestamp ).add( -1, 'ms' ).format(),
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
            }
        );
        if ( switchBlock.eraId > 480 ) {
            await this.circulatingService.updateEraCirculatingSupply(
                await this.eraRepository.findById( switchBlock.eraId )
            );
        }
    }

    private async _createGenesisEra( block: Block ): Promise<void> {
        await this.eraRepository.create( {
            id: 0,
            stakedDiffSinceGenesis: BigInt( 0 ),
            circulatingSupply: BigInt( 0 ),
            stakedDiffThisEra: BigInt( 0 ),
            undelegatedThisEra: BigInt( 0 ),
            stakedThisEra: BigInt( 0 ),
            startBlock: 0,
            start: block.timestamp,
            validatorsWeights: BigInt( environment.genesis_validators_weights_total ),
            validatorsRewards: BigInt( 0 ),
            delegatorsRewards: BigInt( 0 ),
            validatorsCount: 0,
            delegatorsCount: 0,
            rewards: BigInt( 0 ),
            totalSupply: block.totalSupply,
        } );
    }

    private async _getTotalSupply( stateRootHash: string ): Promise<bigint> {
        const blockState: any = await this._casperService().getBlockState(
            stateRootHash,
            environment.contract_uref,
            []
        ).catch( error => {
            logger.error( error );
            throw new Error( error );
        } );

        return BigInt( blockState.CLValue.value.val );
    }

    private async _getValidatorsWeights( weights: any ): Promise<bigint> {
        let validatorWeights = BigInt( 0 );
        weights.forEach( ( item: any ) => {
            validatorWeights += BigInt( item.weight );
        } );
        return validatorWeights;
    }

    private async _processTransfers( transferHashes: string[], blockHeight: number ): Promise<void> {
        for ( const hash of transferHashes ) {
            const deployResult: any = await this._casperService().getDeployInfo( hash );

            for ( const executionResult of deployResult.execution_results ) {
                if ( executionResult?.result?.Success?.effect ) {
                    for ( const transform of executionResult.result.Success.effect.transforms ) {
                        if (
                            transform.transform.WriteTransfer &&
                            executionResult.result.Success.transfers.includes( transform.key )
                        ) {
                            const transfer = transform.transform.WriteTransfer;

                            let knownHex = '';
                            let knownAccount = await this.knownAccountRepository.findOne( {
                                where: {
                                    hash: transfer.to,
                                    hex: {
                                        neq: '',
                                    },
                                }
                            } ).catch( () => {} );
                            if ( knownAccount ) {
                                knownHex = knownAccount.hex || '';
                            }

                            knownAccount = await this.knownAccountRepository.findOne( {
                                where: {
                                    hash: transfer.from,
                                    hex: {
                                        neq: '',
                                    },
                                }
                            } ).catch( () => {} );

                            if ( !knownAccount ) {
                                try {
                                    await this.knownAccountRepository.create( {
                                        hash: transfer.from,
                                        hex: deployResult.deploy.header.account,
                                    } );
                                } catch ( error ) {
                                    console.error( error );
                                }
                            }

                            await this.transferRepository.create( {
                                timestamp: deployResult.deploy.header.timestamp,
                                blockHeight: blockHeight,
                                depth: 0,
                                deployHash: transfer.deploy_hash,
                                from: deployResult.deploy.header.account,
                                fromHash: transfer.from,
                                toHash: transfer.to,
                                to: knownHex,
                                amount: transfer.amount,
                            } );
                        }
                    }
                }
            }
        }
    }

    private async _processDeploys( deploy_hashes: string[] ): Promise<BlockStakeInfo> {
        let staked: BlockStakeInfo = {
            amount: BigInt( 0 ),
            delegated: BigInt( 0 ),
            undelegated: BigInt( 0 ),
        };
        for ( const hash of deploy_hashes ) {
            const deployResult: any = await this._casperService().getDeployInfo( hash );

            for ( const executionResult of deployResult.execution_results ) {
                if (
                    executionResult?.result?.Success &&
                    deployResult?.deploy?.session?.ModuleBytes?.args
                ) {
                    const args = deployResult.deploy.session.ModuleBytes.args;
                    let isDelegated = false;
                    let isUndelegated = false;
                    let isDelegateOperation = 0;
                    let isAddBid = 0;
                    let isWithdrawBid = 0;
                    let currentAmount = BigInt( 0 );

                    args.forEach(
                        ( arg: any ) => {
                            if ( ['public_key', 'amount', 'delegation_rate'].includes( arg[0] ) ) {
                                isAddBid++;
                            }
                            if ( ['public_key', 'amount', 'unbond_purse'].includes( arg[0] ) ) {
                                isWithdrawBid++;
                            }
                            if ( ['validator', 'amount', 'delegator'].includes( arg[0] ) ) {
                                isDelegateOperation++;
                            }
                            if ( arg[0] === 'amount' ) {
                                currentAmount = BigInt( arg[1].parsed );
                            }
                        }
                    );

                    if ( isDelegateOperation === 3 ) {
                        if (
                            executionResult.result.Success.effect &&
                            executionResult.result.Success.effect.transforms
                        ) {
                            executionResult.result.Success.effect.transforms.forEach(
                                ( transform: any ) => {
                                    if ( transform.transform.WriteWithdraw ) {
                                        isUndelegated = true;
                                    }
                                }
                            );
                            if ( !isUndelegated ) {
                                isDelegated = true;
                            }
                        }
                    }

                    if ( isAddBid === 3 || isDelegated ) {
                        staked.amount += currentAmount;
                        staked.delegated += currentAmount;
                    }

                    if ( isWithdrawBid === 3 || isUndelegated ) {
                        staked.amount -= currentAmount;
                        staked.undelegated += currentAmount;
                    }
                }
            }
        }
        return staked;
    }

    private _nominate( amount: bigint ): bigint {
        return amount * BigInt( 1000000000 );
    }

    private _denominate( amount: bigint ): bigint {
        return amount / BigInt( 1000000000 );
    }
}
