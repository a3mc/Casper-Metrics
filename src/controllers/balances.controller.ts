import { lifeCycleObserver, service } from '@loopback/core';
import { repository } from '@loopback/repository';
import * as async from 'async';
import { logger } from '../logger';
import { BalanceRepository, BlockRepository, KnownAccountRepository, PeersRepository, TransferRepository } from '../repositories';
import { CrawlerService } from '../services';

@lifeCycleObserver()
export class BalancesController {
	constructor(
		@repository( TransferRepository ) public transferRepository: TransferRepository,
		@repository( BalanceRepository ) public balanceRepository: BalanceRepository,
		@repository( BlockRepository ) public blockRepository: BlockRepository,
		@service( CrawlerService ) private crawlerService: CrawlerService,
	) {
		console.log( 'Balances controller initialized' );
	}

	// Get all transfers from the database.
	public async getTransfers(): Promise<any> {
		return this.transferRepository.find();
	}

	async start(): Promise<void> {
		await this.crawlerService.getLastBlockHeight();

		// Get last stored block height.
		const lastBlock = await this.blockRepository.findOne( { order: [ 'blockHeight DESC' ] } );

		// Get last balance block height.
		const lastBalance = await this.balanceRepository.findOne( { order: [ 'blockHeight DESC' ] } );

		console.log( 'Balances controller started' );
		const transfers = await this.getTransfers();
		const asyncQueue = [];
		for ( const transfer of transfers ) {
			asyncQueue.push( async () => {
				await this.getBalance( transfer.fromHash.replace( /^account-hash-/, '' ), transfer.blockHeight );
			} );
			asyncQueue.push( async () => {
				await this.getBalance( transfer.toHash.replace( /^account-hash-/, '' ), transfer.blockHeight );
			} );
		}
		await async.parallelLimit( asyncQueue, Number( 5 ) );
		console.log( 'Finished' );
	}

	async getBalance( address: string, blockHeight: number ): Promise<void> {
		const block = await this.blockRepository.findOne( { where: { blockHeight: blockHeight } } );
		if ( !block ) {
			return;
		}
		const service = await this.crawlerService._getCasperService();
		const stateRootHash = block.stateRootHash;

		try {
			const accountHash = address.replace( /^account-hash-/, '' ).toLowerCase();

			const uref = await service.node.getAccountBalanceUrefByPublicKeyHash(
				stateRootHash,
				accountHash,
			);
			const accBalance = ( await service.node.getAccountBalance(
				stateRootHash,
				uref,
			) ).toString();

			// Save balances in repository.
			await this.balanceRepository.create( {
				account_hash: accountHash,
				blockHeight: blockHeight,
				amount: accBalance,
				denomAmount: Math.round(
					Number( this.crawlerService._denominate( BigInt( accBalance ) ) ),
				),
			} );

		} catch ( error ) {
			logger.warn( 'Error getting balance for %s: %s', address, error.message );
			return this.getBalance( address, blockHeight );
		}
	}
}
