import { BindingScope, injectable, service } from '@loopback/core';
import { repository } from '@loopback/repository';
import { Client, HTTPTransport, RequestManager } from '@open-rpc/client-js';
import * as async from 'async';
import Timeout from 'await-timeout';
import axios from 'axios';
import { CasperServiceByJsonRPC } from 'casper-js-sdk';
import dotenv from 'dotenv';
import moment from 'moment';
import { networks } from '../configs/networks';
import { BlockStakeInfo } from '../controllers';
import { logger } from '../logger';
import { Block, Era, Transfer } from '../models';
import {
	BlockRepository,
	DelegatorsRepository,
	EraRepository,
	KnownAccountRepository,
	PeersRepository,
	PriceRepository,
	BalanceRepository,
	TransferRepository,
} from '../repositories';
import { CirculatingService } from './circulating.service';
import { RedisService } from './redis.service';

dotenv.config();

// Represents an interface of the Casper client, wrapped with a few extra properties, for better reusing and control.
export interface CasperServiceSet {
	lastBlock?: number;
	node: CasperServiceByJsonRPC;
	ip: string;
	lastQueried: number;
}

// This service class performs operations of crawling blocks, get deploy infos, and creating Eras, as well
// as some calculating options.
@injectable( { scope: BindingScope.TRANSIENT } )
export class CrawlerService {
	private _casperServices: CasperServiceSet[] = [];
	private _activeRpcNodes: string[] = [];
	// Minimum RPC nodes that report the same high block Height.
	private _minRpcNodes = Number( process.env.MIN_RPC_NODES || 10 );
	// For a long crawling it determines how many blocks to process at once when creating Eras.
	private _calcBatchSize = Number( process.env.CALC_BATCH_SIZE || 25000 );
	// After pinging an RPC node, remove it from the active list if it didn't respond in a given time.
	private _maxRpcTestTimeout = Number( process.env.MAX_RPC_TEST_TIMEOUT || 1500 ); // Don't use nodes that respond slower
	// Don't wait longer than that for any query.
	private _queryTimeout = Number( process.env.QUERY_TIMEOUT || 60000 ); // Throw an error if a query takes longer
	// Allow to launch multiple async tasks when querying for transfers information.
	private _transfersParallelLimit = Number( process.env.TRANSFERS_PARALLEL_LIMIT || 10 );

	// It depends on the repositories to get and save the data and Redis and Circulating Service.
	constructor(
		@repository( EraRepository ) public eraRepository: EraRepository,
		@repository( BlockRepository ) public blocksRepository: BlockRepository,
		@repository( TransferRepository ) public transferRepository: TransferRepository,
		@repository( KnownAccountRepository ) public knownAccountRepository: KnownAccountRepository,
		@repository( PeersRepository ) public peersRepository: PeersRepository,
		@repository( DelegatorsRepository ) public delegatorsRepository: DelegatorsRepository,
		@repository( PriceRepository ) public priceRepository: PriceRepository,
		@repository( BalanceRepository ) public balanceRepository: BalanceRepository,
		@service( RedisService ) public redisService: RedisService,
		@service( CirculatingService ) public circulatingService: CirculatingService,
	) {
	}

	// Get only RPC nodes that return the same last block height and return the highest block if we get enough nodes.
	public async getLastBlockHeight(): Promise<number> {
		await this._resetNetworks();
		logger.debug( 'Trying to init %d nodes', this._activeRpcNodes.length );

		// Push the list of tasks to check nodes to a queue.
		const asyncQueue = [];
		for ( const ip of this._activeRpcNodes ) {
			asyncQueue.push( async () => {
				await this._testRpcNode( ip );
			} );
		}
		// Launch nodes liveliness test in parallel,
		await async.parallelLimit( asyncQueue, 100 );

		// Find the most high block height.
		const maxLastBlock = Math.max.apply( Math, this._casperServices.map( ( node: CasperServiceSet ) => {
			return node.lastBlock ?? 0;
		} ) );

		// All nodes with the same lastBlock, remove the rest.
		this._casperServices = this._casperServices.filter(
			node => node.lastBlock === maxLastBlock,
		);

		// If just few nodes left after filtering by same height, schedule a next try, in a loop.
		if ( this._casperServices.length < this._minRpcNodes ) {
			logger.debug( 'Not enough active RPC nodes with the same last block. Re-trying in 5 seconds.' );
			await this._sleep( 5000 );
			return await this.getLastBlockHeight();
		}

		// Add them to the active list
		for ( const service of this._casperServices ) {
			await this._addService( service );
		}

		logger.debug(
			'Launched %d Casper Services - last block %d',
			this._casperServices.length,
			maxLastBlock,
		);
		return maxLastBlock;
	}

	// Crawl for a block and its deploys.
	public async createBlock( blockHeight: number ): Promise<void> {
		if ( await this.redisService.client.getAsync( 'b' + String( blockHeight ) ) ) {
			throw new Error( 'Block ' + blockHeight + ' already crawled' );
		}
		await this.transferRepository.deleteAll( { blockHeight: blockHeight } );

		// Get a new service - reuse active connections, by going through them round-robin.
		const service = await this._getCasperService();
		// Get block info with a safe timeout wrapper. IF RPC takes too much time to respond, thrown an error.
		const blockInfo: any = await this._withTimeout( service.node, 'getBlockInfoByHeight', [blockHeight] )
			.catch( async () => {
				await this._banService( service );
				// As usually the nature of such errors doesn't matter for us, and usually it's a network error.
				// Just thron an error. No need to write down extra details to the logs - we'll return to that block from another
				// node in next loop.
				throw new Error();
			} );

		// Get some information provided in the block info.
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

		// Get the staked info if there are deploy hashes listed in the info.
		if ( blockInfo.block.body.deploy_hashes?.length ) {
			deploys = blockInfo.block.body.deploy_hashes.length;
			staked = await this._processDeploys( blockInfo.block.body.deploy_hashes );
		}

		// Get transfers, if transfer hashes are listed in the block info.
		if ( blockInfo.block.body.transfer_hashes?.length ) {
			transfers = blockInfo.block.body.transfer_hashes.length;
			await this._processTransfers( blockInfo.block.body.transfer_hashes, blockHeight, eraId, blockInfo );
		}

		// Set some initial values for a new block.
		let isSwitchBlock = false;
		let nextEraValidatorsWeights = BigInt( 0 );
		let validatorsSum = BigInt( 0 );
		let validatorsCount = 0;
		let delegatorsSum = BigInt( 0 );
		let delegatorsCount = 0;

		// If this block is a Switch
		if ( blockInfo.block.header.era_end ) {
			isSwitchBlock = true;
			// Get the weights
			nextEraValidatorsWeights = this._denominate( await this._getValidatorsWeights(
				blockInfo.block.header.era_end.next_era_validator_weights,
			) );

			const service = await this._getCasperService();

			const transport = new HTTPTransport(
				'http://' + service.ip + ':7777/rpc',
			);
			const client = new Client( new RequestManager( [transport] ) );

			// As "chain_get_era_info_by_switch_block" wasn't available in SDK, make a pure http call.
			// Use a safe-timeout wrapper to fail if it doesn't respond in time.
			const result = await this._withTimeout( client, 'request', [
				{
					method: 'chain_get_era_info_by_switch_block',
					params: {
						block_identifier: {
							Hash: blockInfo.block.hash,
						},
					},
				},
			] ).catch( async () => {
				await this._banService( service );
				throw new Error();
			} );

			// Get allocations and process each of them, to calculate the sums.
			const allocations = result.era_summary.stored_value.EraInfo.seigniorage_allocations;

			const indexedValidators = process.env.INDEXED_VALIDATORS?.split( ',' ) || [];

			for ( const allocation of allocations ) {
				if ( allocation.Validator ) {
					validatorsCount++;
					validatorsSum += BigInt( allocation.Validator.amount );
				}
				if ( allocation.Delegator ) {
					delegatorsCount++;
					delegatorsSum += BigInt( allocation.Delegator.amount );

					if (
						indexedValidators.includes( allocation.Delegator.validator_public_key ) &&
						( await this.delegatorsRepository.find( {
							where: {
								eraId: eraId,
								validator: allocation.Delegator.validator_public_key,
								delegator: allocation.Delegator.delegator_public_key,
							},
						} ) ).length === 0
					) {
						let price = 0;
						const foundPrice = await this.priceRepository.find(
							{
								where: {
									and: [
										{ date: { gte: moment( blockInfo.block.header.timestamp ).add( -30, 'minutes' ).format() } },
										{ date: { lt: moment( blockInfo.block.header.timestamp ).add( 30, 'minutes' ).format() } },
									],
								},
								limit: 1,
								fields: ['close'],
							},
						);

						if ( foundPrice && foundPrice.length ) {
							price = foundPrice[0].close;
						}

						if ( ( await this.delegatorsRepository.find( {
							where: {
								eraId: blockInfo.block.header.era_id,
								validator: allocation.Delegator.validator_public_key,
								delegator: allocation.Delegator.delegator_public_key,
							},
						} ) ).length === 0 ) {
							await this.delegatorsRepository.create( {
								eraId: blockInfo.block.header.era_id,
								created_at: blockInfo.block.header.timestamp,
								amount: allocation.Delegator.amount,
								validator: allocation.Delegator.validator_public_key,
								delegator: allocation.Delegator.delegator_public_key,
								usdAmount: price * Number( allocation.Delegator.amount ) / 1000000000,
							} );
						}
					}
				}
			}
		}

		// Just to be sure we are not creating the same block twice, remove it, if it exists.
		if ( await this.blocksRepository.exists( blockHeight ) ) {
			await this.blocksRepository.deleteById( blockHeight );
		}
		// Create the block with calculated values.
		await this.blocksRepository.create( {
			blockHeight: blockHeight,
			blockHash: blockInfo.block.hash,
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

		// In case of success, write it to Redis db, so we don't touch this block again in the next loop.
		await this.redisService.client.setAsync( 'b' + String( blockHeight ), 1 );
	}

	public async fixMissingPrices(): Promise<void> {
		const zeroPrices = await this.delegatorsRepository.find( {
			where: {
				usdAmount: 0,
				eraId: { gt: 6000 },
			}
		} );
		if ( zeroPrices && zeroPrices.length ) {
			logger.debug( 'Fixing missing prices for ' + zeroPrices.length + ' delegators' );
			for ( const zeroPrice of zeroPrices ) {
				const price = await this.priceRepository.findOne( {
					where: {
						and: [
							{ date: { gte: moment( zeroPrice.created_at ).utc().add( -30, 'minutes' ).format() } },
							{ date: { lt: moment( zeroPrice.created_at ).utc().add( 30, 'minutes' ).format() } },
						],
					},
					limit: 1,
					fields: ['close'],
				},);
				if ( price && price.close ) {
					zeroPrice.usdAmount = price.close * Number( zeroPrice.amount ) / 1000000000;
					await this.delegatorsRepository.updateById( zeroPrice.id, zeroPrice );
				}
			}
		}
	}

	// Once we have all blocks in a batch, we can create eras.
	public async calcBlocksAndEras(): Promise<void> {
		// Set a flag that we started to create eras. No need to crawl new blocks at the same time.
		await this.redisService.client.setAsync( 'calculating', 1 );

		// Get the last block for which the era was created, to start from the next one.
		const lastCalculated: number = Number( await this.redisService.client.getAsync( 'lastcalc' ) );
		let blocks: Block[] = await this.blocksRepository.find( {
			where: { blockHeight: { gt: lastCalculated || -1 } },
		} );
		const totalBlockSize = blocks.length;

		// Limit the amount of consequent blocks, to prevent high load on the resources.
		if ( totalBlockSize > this._calcBatchSize ) {
			logger.debug(
				'Calculation started. Taking %d of %d blocks total',
				this._calcBatchSize,
				totalBlockSize,
			);
			blocks = blocks.slice( 0, this._calcBatchSize );
		} else {
			logger.debug( 'Calculation started. Processing %d blocks', totalBlockSize );
		}

		let blockCount = 0;

		// Loop through the blocks in the batch.
		for ( const block of blocks ) {
			// Update transfers info for each block.
			await this._updateBlockTransfers( block );

			let prevBlock: Block | null = null;

			// Find a previous block if it exists.
			if ( block.blockHeight > 0 ) {
				if ( blockCount > 0 ) {
					prevBlock = blocks[blockCount - 1];
				} else {
					prevBlock = await this.blocksRepository.findById( block.blockHeight - 1 );
				}
			} else {
				// Prevent creating a duplicate era.
				if ( await this.eraRepository.exists( 0 ) ) {
					await this.eraRepository.deleteById( 0 );
				}
				// If previous block doesn't exist, create a Genesis era.
				await this._createGenesisEra( block );
			}

			// If previous block was a Switch, create new era, by passing both blocks.
			if ( prevBlock && prevBlock.switch ) {
				await this._createNewEra( prevBlock, block );

				const completedEra: Era = await this.eraRepository.findById( prevBlock.eraId );
				// Find all blocks of the new era.
				let eraBlocks: Block[] = blocks.filter( eraBlock => eraBlock.eraId === prevBlock?.eraId );
				if ( !eraBlocks.some( eraBlock => eraBlock.blockHeight === completedEra.startBlock ) ) {
					eraBlocks = await this.blocksRepository.find( {
						where: {
							eraId: completedEra.id,
						},
					} );
				}
				// Update completed era by passing switch block and a collection of era's blocks.
				await this._updateCompletedEra( prevBlock, eraBlocks );
			}
			// Count the blocks that were processed in the loop.
			blockCount++;
		}

		// Increase the record of the last processed block, so we can start later after it.
		await this.redisService.client.setAsync( 'lastcalc', blocks[blocks.length - 1].blockHeight );

		// Continue if more blocks left.
		if ( totalBlockSize > this._calcBatchSize ) {
			await this.calcBlocksAndEras();
		} else {
			// Or switch of the calculating flag and return to the main app loop.
			await this.redisService.client.setAsync( 'calculating', 0 );
			logger.debug( 'Calculation finished.' );
		}
	}

	// Get a list of RPC nodes.
	public async setCasperServices(): Promise<void> {
		this._casperServices = [];
		for ( const ip of await this._retrieveActiveRPCNodes() ) {
			const lastQueried: string = await this.redisService.client.getAsync( 'rpc' + ip );
			if ( lastQueried ) {
				this._casperServices.push( {
					node: new CasperServiceByJsonRPC(
						'http://' + ip + ':7777/rpc',
					),
					ip: ip,
					lastQueried: parseInt( lastQueried ),
				} );
			}
		}
	}

	// Find a relative depth from Genesis vaults.
	private async _updateBlockTransfers( block: Block ): Promise<void> {
		const blockTransfers: Transfer[] = await this.transferRepository.find( {
			where: {
				blockHeight: block.blockHeight,
			},
		} );

		// Loop through all transfers of the block.
		for ( const transfer of blockTransfers ) {
			let depth = 0;
			if ( networks.locked_wallets.includes( transfer.from.toUpperCase() ) ) {
				depth = 1;
			} else {
				// Try to find how far the transfer was from the Genesis vaults, by calculating the depth.
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
				// Try to find  hex address for "to" account by checking known accounts.
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
				// Update the transfers table.
				await this.transferRepository.updateById( transfer.id, transfer );
			}
		}
	}

	// Check if RPC node can be used for crawling.
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
			// As a test, make a simpe query to see if it respons with the last block Height
			blockInfo = await this._getLastBlockWithTimeout( casperServiceSet.node );
		} catch ( error ) {
			// Don't use it in this loop, if not.
			logger.debug( 'Failed to init Casper Node %s', ip );
			return;
		}
		try {
			casperServiceSet.lastBlock = blockInfo.block.header.height;
		} catch ( error ) {
			logger.debug( 'Node didn\'t return lastBlock %s', ip );
			return;
		}
		// Add to the collection of RPC services that can be used.
		this._casperServices.push( casperServiceSet );
	}

	// Refresh the list of RPC services
	private async _resetNetworks(): Promise<void> {
		this._casperServices = [];
		this._activeRpcNodes = Object.assign( [], await this._retrieveActiveRPCNodes() );
		for ( const ip of this._activeRpcNodes ) {
			await this._deleteService( ip );
		}
	}

	// Get the list of active RPC nodes IPs
	private async _retrieveActiveRPCNodes(): Promise<string[]> {
		// First determine the last version stored in the list.
		const lastVersionResult = await this.peersRepository.find( {
			limit: 1,
			order: ['version DESC'],
			fields: ['version'],
		} );

		if ( lastVersionResult?.length ) {
			// Get only active validators with open rpc and valid status
			const rpcs = await this.peersRepository.find( {
				where: {
					mission: 'VALIDATOR',
					rpc: 'RPC_OPEN',
					status: 'STATUS_AVAILABLE',
					version: lastVersionResult[0].version,
				},
				fields: ['ip'],
			} );

			// We need only IPs to initialise the nodes.
			if ( rpcs && rpcs.length ) {
				return rpcs.map( item => item.ip );
			} else {
				return [];
			}
		}
		return [];
	}

	// Add RPC service to the list
	private async _addService( service: CasperServiceSet ): Promise<void> {
		await this.redisService.client.setAsync( 'rpc' + service.ip, moment().valueOf().toString() );
	}

	// Mark RPC service as having issues
	private async _banService( service: CasperServiceSet ): Promise<void> {
		// TODO - rate nodes performance, to exclude slow nodes in next batches
		// That might be node needed for now, but good to have this method for future, if want to make
		// some further modifications in crawling, so we can catch "bad" nodes here.
		// It can also be used just for debugging purposes. No actual banning happens here.
	}

	// Remove RPC service from the list
	private async _deleteService( ip: String ): Promise<void> {
		await this.redisService.client.deleteAsync( 'rpc' + ip );
	}

	// Use servers that didn't respond in time or had errors more rare.
	public async _getCasperService(): Promise<CasperServiceSet> {
		if ( !this._casperServices.length ) {
			throw new Error( 'No RPC services available.' );
		}
		const rpcs: CasperServiceSet[] = [];
		for ( const service of this._casperServices ) {
			const lastQueried: string = await this.redisService.client.getAsync( 'rpc' + service.ip );
			service.lastQueried = parseInt( lastQueried );
			rpcs.push( service );
		}

		// Try to first get the node from the list that hasn't been called for a while.
		rpcs.sort( ( a: CasperServiceSet, b: CasperServiceSet ) => {
			return ( ( a.lastQueried > b.lastQueried ) ? 1 : ( ( a.lastQueried < b.lastQueried ) ? -1 : 0 ) );
		} );
		await this.redisService.client.setAsync( 'rpc' + rpcs[0].ip, moment().valueOf().toString() );
		return rpcs[0];
	}

	// Make sure RPC node responds within defined time.
	private async _getLastBlockWithTimeout( node: CasperServiceByJsonRPC ): Promise<any> {
		const timer = new Timeout();
		try {
			return await Promise.race( [
				node.getLatestBlockInfo(),
				timer.set( this._maxRpcTestTimeout, 'Timeout' ),
			] );
		} finally {
			timer.clear();
		}
	}

	// Throw an error if request takes too much time.
	public async _withTimeout( call: any, method: string, param: any[] ): Promise<any> {
		const timer = new Timeout();
		try {
			return await Promise.race( [
				call[method]( ...param ),
				timer.set( this._queryTimeout, 'Timeout' ),
			] );
		} finally {
			timer.clear();
		}
	}

	// Create new Era: prevBlock is a Switch block, and the block is the next block.
	private async _createNewEra( prevBlock: Block, block: Block ): Promise<void> {
		if ( !await this.eraRepository.exists( block.eraId ) ) {
			// Create an Era. It will be popuplated on the next step, when gets completed.
			await this.eraRepository.create( {
				id: block.eraId,
				circulatingSupply: BigInt( 0 ),
				validatorsCirculatingSupply: BigInt( 0 ),
				transfersCirculatingSupply: BigInt( 0 ),
				rewardsCirculatingSupply: BigInt( 0 ),
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
			} ).catch( e => {
				logger.error( e );
				throw new Error( 'Cannot create new era ' + block.eraId );
			} );
		}
	}

	// Once we have switch block we can update completed Era with the details.
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
		// Loop through all the blocks of the completed era to perform calculations.
		for ( const eraBlock of eraBlocks ) {
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
		// Update the era with more info.
		await this.eraRepository.updateById(
			switchBlock.eraId,
			{
				totalSupply: switchBlock.totalSupply,
				circulatingSupply: BigInt( 0 ),
				validatorsCirculatingSupply: BigInt( 0 ),
				transfersCirculatingSupply: BigInt( 0 ),
				rewardsCirculatingSupply: BigInt( 0 ),
				endBlock: switchBlock.blockHeight,
				end: switchBlock.timestamp,
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
		// As there were no transfers before era 480, it can just save some time when crawling from genesis.
		if ( switchBlock.eraId > 480 ) {
			await this.circulatingService.updateEraCirculatingSupply(
				await this.eraRepository.findById( switchBlock.eraId ),
			);
		}
	}

	// As it's a 'special' Era it is here as a separate method.
	private async _createGenesisEra( block: Block ): Promise<void> {
		logger.debug( 'Creating genesis era' );
		await this.eraRepository.create( {
			id: 0,
			circulatingSupply: BigInt( 0 ),
			validatorsCirculatingSupply: BigInt( 0 ),
			transfersCirculatingSupply: BigInt( 0 ),
			rewardsCirculatingSupply: BigInt( 0 ),
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

	// Call block for a total supply.
	private async _getTotalSupply( stateRootHash: string ): Promise<bigint> {
		const service = await this._getCasperService();

		const blockState: any = await this._withTimeout( service.node, 'getBlockState', [
				stateRootHash,
				networks.contract_uref,
				[],
			],
		).catch( async () => {
			await this._banService( service );
			throw new Error();
		} );

		return BigInt( blockState.CLValue.data );
	}

	// Sum the validators weights.
	private async _getValidatorsWeights( weights: any ): Promise<bigint> {
		let validatorWeights = BigInt( 0 );
		weights.forEach( ( item: any ) => {
			validatorWeights += BigInt( item.weight );
		} );
		return validatorWeights;
	}

	// We try to find HEX account values here when possible.
	private async _processTransfers( transferHashes: string[], blockHeight: number, eraId: number, blockInfo: any ): Promise<void> {

		// Use a queue to put parallel tasks in it, that helps to boost performance.
		const asyncQueue = [];
		for ( const hash of transferHashes ) {
			asyncQueue.push( async () => {
				const service = await this._getCasperService();
				const deployResult: any = await this._withTimeout( service.node, 'getDeployInfo', [hash] )
					.catch( async () => {
						await this._banService( service );
						throw new Error();
					} );

				// Parse the returned results to extract the data we look for.
				for ( const executionResult of deployResult.execution_results ) {
					if ( executionResult?.result?.Success?.effect ) {
						for ( const transform of executionResult.result.Success.effect.transforms ) {
							// Just to make sure we don't get into a bug with different formats, use lower case.
							const transformKey = transform.key.toLowerCase();
							const successTransfers = executionResult.result.Success.transfers.map(
								( item: string ) => item.toLowerCase(),
							);
							if (
								transform.transform.WriteTransfer &&
								successTransfers.includes( transformKey )
							) {
								const transfer = transform.transform.WriteTransfer;
								let knownHex = '';
								// Check if we have the hash in the known accounts.
								let knownAccount = await this.knownAccountRepository.findOne( {
									where: {
										hash: transfer.to,
										hex: {
											neq: '',
										},
									},
								} ).catch();

								// Then we can save the hex, along with the account hash.
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

								// Insert a records into the transfers table.
								await this.transferRepository.create( {
									timestamp: deployResult.deploy.header.timestamp,
									blockHeight: blockHeight,
									depth: 0,
									eraId: eraId,
									deployHash: transfer.deploy_hash,
									from: deployResult.deploy.header.account || transfer.source,
									fromHash: transfer.from || transfer.source,
									toHash: transfer.to || transfer.target,
									to: knownHex,
									amount: transfer.amount,
									denomAmount: Math.round(
										Number( this._denominate( BigInt( transfer.amount ) ) ),
									),
								} );

								if ( blockInfo.block?.header?.state_root_hash ) {
									try {
										const accountHash = ( transfer.from || transfer.source ).replace( /^account-hash-/, '' );
										const stateRootHash = blockInfo.block.header.state_root_hash;
										const uref = await service.node.getAccountBalanceUrefByPublicKeyHash(
											stateRootHash,
											accountHash,
										);
										const accBalance = ( await service.node.getAccountBalance(
											stateRootHash,
											uref,
										) ).toString();

										const accountToHash = ( transfer.to || transfer.target ).replace( /^account-hash-/, '' );
										const urefTo = await service.node.getAccountBalanceUrefByPublicKeyHash(
											stateRootHash,
											accountToHash,
										);
										const accBalanceTo = ( await service.node.getAccountBalance(
											stateRootHash,
											urefTo,
										) ).toString();

										// Save balances in repository.
										await this.balanceRepository.create( {
											account_hash: accountHash,
											blockHeight: blockHeight,
											amount: accBalance,
											denomAmount: Math.round(
												Number( this._denominate( BigInt( accBalance ) ) ),
											),
										} );
										await this.balanceRepository.create( {
											account_hash: accountToHash,
											blockHeight: blockHeight,
											amount: accBalanceTo,
											denomAmount: Math.round(
												Number( this._denominate( BigInt( accBalanceTo ) ) ),
											),
										} );

									} catch ( error ) {
										await this._banService( service );
										throw new Error();
									}

								}

							}
						}
					}
				}
			} );
		}

		// Launch the queue with the tasks in paralel.
		await async.parallelLimit( asyncQueue, this._transfersParallelLimit );
	}

	// Count staked/unbonded
	private async _processDeploys( deploy_hashes: string[] ): Promise<BlockStakeInfo> {
		let staked: BlockStakeInfo = {
			amount: BigInt( 0 ),
			delegated: BigInt( 0 ),
			undelegated: BigInt( 0 ),
		};

		const asyncQueue = [];
		for ( const hash of deploy_hashes ) {
			asyncQueue.push( async () => {
				const service = await this._getCasperService();
				const deployResult: any = await this._withTimeout( service.node, 'getDeployInfo', [hash] )
					.catch( async () => {
						await this._banService( service );
						throw new Error();
					} );

				// Parse the result of each deploy hash.
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

						// Determine the type of delegation operation it was and update the values accordingly.
						// These combinations are unique for each type.

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

						// Calculate whether the amount was delegated or unstaked

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
			} );
		}

		// Launch in parallel.
		await async.parallelLimit( asyncQueue, this._transfersParallelLimit );
		// Return the staked object that represents the sums that were staked/unbonded.
		return staked;
	}

	// Helper method to convert from motes.
	public _denominate( amount: bigint ): bigint {
		return amount / BigInt( 1000000000 );
	}

	// A helper for a delay.
	private _sleep( ms: number ): Promise<any> {
		return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
	}
}
