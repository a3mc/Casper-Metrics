import { BindingScope, injectable, service } from '@loopback/core';
import { logger } from '../logger';
import { CasperServiceByJsonRPC } from 'casper-js-sdk';
import { BlockStakeInfo } from '../controllers';
import { Block, Era, Transfer } from '../models';
import { networks } from '../configs/networks';
import { repository } from '@loopback/repository';
import {
	BlockRepository,
	EraRepository,
	KnownAccountRepository,
	TransferRepository,
} from '../repositories';
import Timeout from 'await-timeout';
import { Client, HTTPTransport, RequestManager } from '@open-rpc/client-js';
import { RedisService } from './redis.service';
import moment from 'moment';
import { CirculatingService } from './circulating.service';
import dotenv from 'dotenv';
import * as async from 'async';
dotenv.config();

export interface CasperServiceSet {
	lastBlock?: number;
	node: CasperServiceByJsonRPC;
	ip: string;
	lastQueried: number;
	banLevel?: number;
}

@injectable( { scope: BindingScope.TRANSIENT } )
export class CrawlerService {
	private _casperServices: CasperServiceSet[] = [];
	private _activeRpcNodes: string[] = [];
	private _minRpcNodes = 10;
	private _maxRpcBanLevel = 100;
	private _calcBatchSize = 50000;

	constructor(
		@repository( EraRepository ) public eraRepository: EraRepository,
		@repository( BlockRepository ) public blocksRepository: BlockRepository,
		@repository( TransferRepository ) public transferRepository: TransferRepository,
		@repository( KnownAccountRepository ) public knownAccountRepository: KnownAccountRepository,
		@service( RedisService ) public redisService: RedisService,
		@service( CirculatingService ) public circulatingService: CirculatingService,
	) {
	}

	public async getLastBlockHeight(): Promise<number> {
		await this._resetNetworks();
		logger.debug( 'Trying to init %d nodes', this._activeRpcNodes.length );

		const asyncQueue = [];
		for ( const ip of this._activeRpcNodes ) {
			asyncQueue.push( async () => {
				await this._testRpcNode( ip );
			} );
		}

		await async.parallelLimit( asyncQueue, 100 );

		const maxLastBlock = Math.max.apply( Math, this._casperServices.map( ( node: CasperServiceSet ) => {
			return node.lastBlock ?? 0;
		} ) );

		// All nodes with the same lastBlock
		this._casperServices = this._casperServices.filter(
			node => node.lastBlock === maxLastBlock
		);

		if ( this._casperServices.length < this._minRpcNodes ) {
			logger.debug ( 'Not enough active RPC nodes with the same last block. Re-trying in 5 seconds.' );
			await this._sleep( 5000 );
			return await this.getLastBlockHeight();
		}

		// Add them to the active list
		for ( const service of this._casperServices ) {
			await this._addService( service );
		}
		
		logger.info(
			'Launched %d Casper Services - last block %d',
			this._casperServices.length,
			maxLastBlock,
		);
		return maxLastBlock;
	}

	public async createBlock( blockHeight: number ): Promise<void> {
		if ( await this.redisService.client.getAsync( 'b' + String( blockHeight ) ) ) {
			throw new Error( 'Block ' + blockHeight + ' already crawled' );
		}
		await this.transferRepository.deleteAll( { blockHeight: blockHeight } );

		const service = await this._getCasperService();
		const blockInfo: any = await service.node.getBlockInfoByHeight( blockHeight )
			.catch( async () => {
				await this._banService( service );
				throw new Error( 'Cant getblock info in createBLock' );
			} );

		const stateRootHash: string = blockInfo.block.header.state_root_hash;
		const totalSupply: bigint = await this._getTotalSupply( stateRootHash );

		let deploys = 0;
		let transfers = 0;
		let staked: BlockStakeInfo = {
			amount: BigInt( 0 ),
			delegated: BigInt( 0 ),
			undelegated: BigInt( 0 ),
		};

		const eraId: number = blockInfo.block.header.era_id;

		if ( blockInfo.block.body.deploy_hashes?.length ) {
		    deploys = blockInfo.block.body.deploy_hashes.length;
		    staked = await this._processDeploys( blockInfo.block.body.deploy_hashes );
		}

		if ( blockInfo.block.body.transfer_hashes?.length ) {
		    transfers = blockInfo.block.body.transfer_hashes.length;
		    await this._processTransfers( blockInfo.block.body.transfer_hashes, blockHeight, eraId );
		}

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


		    const service = await this._getCasperService();

		    const transport = new HTTPTransport(
		        'http://' + service.ip + ':7777/rpc'
		    );
		    const client = new Client( new RequestManager( [transport] ) );

		    const result = await client.request( {
		        method: 'chain_get_era_info_by_switch_block',
		        params: {
		            block_identifier: {
		                Hash: blockInfo.block.hash
		            }
		        }
		    } )
		        .catch( error => {
					this._banService( service );
		            logger.debug( 'Error getting chain_get_era_info_by_switch_block')
		            throw new Error( error );
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

		if ( await this.blocksRepository.exists( blockHeight ) ) {
			await this.blocksRepository.deleteById( blockHeight );
		}
		await this.blocksRepository.create( {
			blockHeight: blockHeight,
			eraId: eraId,
			timestamp: blockInfo.block.header.timestamp,
			stateRootHash: stateRootHash,
			totalSupply: this._denominate( totalSupply ),
			stakedThisBlock: this._denominate( staked.delegated ),
			undelegatedThisBlock: this._denominate( staked.undelegated ),
			nextEraValidatorsWeights: nextEraValidatorsWeights,
			validatorsRewards: this._denominate( validatorsSum ),
			delegatorsRewards: this._denominate( delegatorsSum ),
			validatorsCount: validatorsCount,
			delegatorsCount: delegatorsCount,
			rewards: this._denominate( validatorsSum + delegatorsSum ),
			switch: isSwitchBlock,
			circulatingSupply: BigInt( 0 ),
			validatorsWeights: BigInt( 0 ),
			deploysCount: deploys,
			transfersCount: transfers,
		} );

		await this.redisService.client.setAsync( 'b' + String( blockHeight ), 1 );
	}

	public async calcBlocksAndEras(): Promise<void> {

		await this.redisService.client.setAsync( 'calculating', 1 );

		const lastCalculated: number = Number( await this.redisService.client.getAsync( 'lastcalc' ) );
		let blocks: Block[] = await this.blocksRepository.find( {
			where: { blockHeight: { gt: lastCalculated || -1 } },
		} );
		const totalBlockSize = blocks.length;

		if ( totalBlockSize > this._calcBatchSize ) {
			logger.info(
				'Calculation started. Taking %d of %d blocks total',
				this._calcBatchSize,
				totalBlockSize
			);
			blocks = blocks.slice( 0, this._calcBatchSize );
		} else {
			logger.info( 'Calculation started. Processing %d blocks', totalBlockSize );
		}

		let blockCount = 0;
		let queue = [];

		for ( const block of blocks ) {
			queue.push( async() => { await this._updateBlockTransfers( block ); }  );

			let prevBlock: Block | null = null;

			if ( block.blockHeight > 0 ) {
				if ( blockCount > 0 ) {
					prevBlock = blocks[blockCount - 1];
				} else {
					prevBlock = await this.blocksRepository.findById( block.blockHeight - 1 );
				}
			} else {
				if ( await this.eraRepository.exists( 0 ) ) {
					await this.eraRepository.deleteById( 0 );
				}
				await this._createGenesisEra( block );
			}

			if ( prevBlock && prevBlock.switch ) {
				await this._createNewEra( prevBlock, block );

				const completedEra: Era = await this.eraRepository.findById( prevBlock.eraId );
				let eraBlocks: Block[] = blocks.filter( eraBlock => eraBlock.eraId === prevBlock?.eraId );
				if ( !eraBlocks.some( eraBlock => eraBlock.blockHeight === completedEra.startBlock ) ) {
					eraBlocks = await this.blocksRepository.find( {
						where: {
							eraId: completedEra.id,
						},
					} );
				}
				await this._updateCompletedEra( prevBlock, eraBlocks );
			}

			blockCount++;
		}

		await async.parallelLimit( queue, 200 );

		await this.redisService.client.setAsync( 'lastcalc', blocks[blocks.length - 1].blockHeight );

		if ( totalBlockSize > this._calcBatchSize ) {
			await this.calcBlocksAndEras();
		} else {
			await this.redisService.client.setAsync( 'calculating', 0 );
			logger.info( 'Calculation finished.' );
		}
	}

	public async setCasperServices(): Promise<void> {
		this._casperServices = [];
		for ( const ip of networks.rpc_nodes ) {
			const lastQueried: string = await this.redisService.client.getAsync( 'rpc' + ip );
			const banned: string = await this.redisService.client.getAsync( 'ban' + ip );
			if ( lastQueried ) {
				this._casperServices.push( {
					node: new CasperServiceByJsonRPC(
						'http://' + ip + ':7777/rpc',
					),
					ip: ip,
					lastQueried: parseInt( lastQueried ),
					banLevel: parseInt( banned ?? '0' ),
				} );
			}
		}
	}

	private async _updateBlockTransfers( block: Block ): Promise<void> {
		const blockTransfers: Transfer[] = await this.transferRepository.find( {
			where: {
				blockHeight: block.blockHeight,
			},
		} );

		for ( const transfer of blockTransfers ) {
			let depth = 0;
			if ( networks.locked_wallets.includes( transfer.from.toUpperCase() ) ) {
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
						],
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
								neq: '',
							},
						},
					} ).catch();
					if ( knownAccount ) {
						transfer.to = knownAccount.hex;
					}
				}

				await this.transferRepository.updateById( transfer.id, transfer );
			}
		}
	}

	private async _testRpcNode( ip: string ): Promise<void> {
		const casperServiceSet: CasperServiceSet = {
			node: new CasperServiceByJsonRPC(
				'http://' + ip + ':7777/rpc',
			),
			ip: ip,
			lastQueried: 0,
		};

		let blockInfo;
		try {
			blockInfo = await this._getLastBlockWithTimeout( casperServiceSet.node );
		} catch ( error ) {
			logger.debug( 'Failed to init Casper Node %s', ip );
			return;
		}
		try {
			casperServiceSet.lastBlock = blockInfo.block.header.height;
		} catch ( error ) {
			logger.debug( 'Node didn\'t return lastBlock %s', ip );
			return;
		}
		this._casperServices.push( casperServiceSet )
	}

	private async _resetNetworks(): Promise<void> {
		this._casperServices = [];
		this._activeRpcNodes = Object.assign( [], networks.rpc_nodes );
		for ( const ip of this._activeRpcNodes ) {
			await this._deleteService( ip );
		}
	}

	private async _addService( service: CasperServiceSet ): Promise<void> {
		await this.redisService.client.setAsync( 'rpc' + service.ip, moment().valueOf().toString() );
		await this.redisService.client.setAsync( 'ban' + service.ip, '0' );
	}

	private async _banService( service: CasperServiceSet ): Promise<void> {
		let banLevel = Number( await this.redisService.client.getAsync( 'ban' + service.ip ) );
		banLevel ++;
		await this.redisService.client.setAsync( 'ban' + service.ip, banLevel.toString() );
		logger.debug( 'Banned %s to %d level', service.ip, banLevel );
	}

	private async _deleteService( ip: String ): Promise<void> {
		await this.redisService.client.deleteAsync( 'rpc' + ip );
		await this.redisService.client.deleteAsync( 'ban' + ip );
	}

	private async _getCasperService(): Promise<CasperServiceSet> {
		if ( ! this._casperServices.length ) {
			throw new Error( 'No RPC services available.' );
		}
		const rpcs: CasperServiceSet[] = [];
		for ( const service of this._casperServices ) {
			const lastQueried: string = await this.redisService.client.getAsync( 'rpc' + service.ip );
			const banned: string = await this.redisService.client.getAsync( 'ban' + service.ip );
			service.lastQueried = parseInt( lastQueried  );
			service.banLevel = parseInt( banned );
			if ( service.banLevel < this._maxRpcBanLevel ) {
				rpcs.push( service );
			}
		}

		rpcs.sort( ( a: CasperServiceSet, b: CasperServiceSet ) => {
			return ( ( a.lastQueried > b.lastQueried ) ? 1 : ( ( a.lastQueried < b.lastQueried ) ? -1 : 0 ) );
		} );
		await this.redisService.client.setAsync( 'rpc' + rpcs[0].ip, moment().valueOf().toString() );
		return rpcs[0];
	}

	private async _getLastBlockWithTimeout( node: CasperServiceByJsonRPC ): Promise<any> {
		const timer = new Timeout();
		try {
			return await Promise.race( [
				node.getLatestBlockInfo(),
				timer.set( 5000, 'Timeout' ),
			] );
		} finally {
			timer.clear();
		}
	}

	private async _createNewEra( prevBlock: Block, block: Block ): Promise<void> {
		if ( !await this.eraRepository.exists( block.eraId ) ) {
			await this.eraRepository.create( {
				id: block.eraId,
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
			await this.eraRepository.findById( block.eraId ),
		);
	}

	private async _updateCompletedEra( switchBlock: Block, eraBlocks: Block[] ): Promise<void> {
		let stakedInfo: BlockStakeInfo = {
			amount: BigInt( 0 ),
			delegated: BigInt( 0 ),
			undelegated: BigInt( 0 ),
		};
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
			},
		);
		if ( switchBlock.eraId > 480 ) {
			await this.circulatingService.updateEraCirculatingSupply(
				await this.eraRepository.findById( switchBlock.eraId ),
			);
		}
	}

	private async _createGenesisEra( block: Block ): Promise<void> {
		await this.eraRepository.create( {
			id: 0,
			circulatingSupply: BigInt( 0 ),
			stakedDiffThisEra: BigInt( 0 ),
			undelegatedThisEra: BigInt( 0 ),
			stakedThisEra: BigInt( 0 ),
			startBlock: 0,
			start: block.timestamp,
			validatorsWeights: BigInt( networks.genesis_validators_weights_total ),
			validatorsRewards: BigInt( 0 ),
			delegatorsRewards: BigInt( 0 ),
			validatorsCount: 0,
			delegatorsCount: 0,
			rewards: BigInt( 0 ),
			totalSupply: block.totalSupply,
		} );
	}

	private async _getTotalSupply( stateRootHash: string ): Promise<bigint> {
		const service = await this._getCasperService();
		const blockState: any = await service.node.getBlockState(
			stateRootHash,
			networks.contract_uref,
			[],
		).catch( async () => {
			await this._banService( service );
			throw new Error();
		} );

		return BigInt( blockState.CLValue.data );
	}

	private async _getValidatorsWeights( weights: any ): Promise<bigint> {
		let validatorWeights = BigInt( 0 );
		weights.forEach( ( item: any ) => {
			validatorWeights += BigInt( item.weight );
		} );
		return validatorWeights;
	}

	private async _processTransfers( transferHashes: string[], blockHeight: number, eraId: number ): Promise<void> {

		for ( const hash of transferHashes ) {
			const service = await this._getCasperService();
			const deployResult: any = await service.node.getDeployInfo( hash )
				.catch( async ( error ) => {
					await this._banService( service );
					throw new Error( error );
				} );

			for ( const executionResult of deployResult.execution_results ) {
				if ( executionResult?.result?.Success?.effect ) {
					for ( const transform of executionResult.result.Success.effect.transforms ) {
						const transformKey = transform.key.toLowerCase();
						const successTransfers = executionResult.result.Success.transfers.map(
							( item: string ) => item.toLowerCase()
						);
						if (
							transform.transform.WriteTransfer  &&
							successTransfers.includes( transformKey )
						) {
							const transfer = transform.transform.WriteTransfer;
							let knownHex = '';
							let knownAccount = await this.knownAccountRepository.findOne( {
								where: {
									hash: transfer.to,
									hex: {
										neq: '',
									},
								},
							} ).catch();

							if ( knownAccount ) {
								knownHex = knownAccount.hex || '';
							}

							knownAccount = await this.knownAccountRepository.findOne( {
								where: {
									hash: transfer.from,
									hex: {
										neq: '',
									},
								},
							} ).catch();

							if ( !knownAccount ) {
								try {
									await this.knownAccountRepository.create( {
										hash: transfer.from,
										hex: deployResult.deploy.header.account,
									} );
								} catch ( error ) {
									logger.debug( error );
								}
							}

							await this.transferRepository.create( {
								timestamp: deployResult.deploy.header.timestamp,
								blockHeight: blockHeight,
								depth: 0,
								eraId: eraId,
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
			const service = await this._getCasperService();
			const deployResult: any = await service.node.getDeployInfo( hash )
				.catch( async () => {
					await this._banService( service );
					throw new Error();
				} );;

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
						},
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
								},
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

	private _sleep( ms: number ): Promise<any> {
		return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
	}
}
