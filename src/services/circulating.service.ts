import { BindingScope, injectable } from '@loopback/core';
import { repository } from '@loopback/repository';
import moment from 'moment';
import { networks } from '../configs/networks';
import { logger } from '../logger';
import { Era, Transfer, ValidatorsUnlock } from '../models';
import { BlockRepository, EraRepository, ProcessingRepository, TransferRepository, ValidatorsUnlockRepository } from '../repositories';

@injectable( { scope: BindingScope.TRANSIENT } )
export class CirculatingService {
	constructor(
		@repository( EraRepository )
		public eraRepository: EraRepository,
		@repository( BlockRepository )
		public blocksRepository: BlockRepository,
		@repository( TransferRepository )
		public transferRepository: TransferRepository,
		@repository( ValidatorsUnlockRepository )
		public validatorsUnlockRepository: ValidatorsUnlockRepository,
		@repository( ProcessingRepository )
		public processingRepository: ProcessingRepository,
	) {
	}

	public async calculateCirculatingSupply(): Promise<void> {
		// Set a flag to prevent saving when update is in progress.
		let status = await this.processingRepository.findOne( {
			where: {
				type: 'updating',
			},
		} );
		if ( status ) {
			status.value = true;
			await this.processingRepository.save( status );
		} else {
			await this.processingRepository.create(
				{
					type: 'updating',
					value: true,
				},
			);
		}
		logger.debug( 'Updating Eras Circulating Supply' );

		// Update each era to store calculated circulating supply.
		// New eras will be updated automatically.
		const eras = await this.eraRepository.find( {
			fields: ['id', 'start', 'end', 'totalSupply', 'validatorsWeights'],
		} );
		for ( const era of eras ) {
			await this.updateEraCirculatingSupply( era );
		}

		// Switch of the flag to allow further editing.
		status = await this.processingRepository.findOne( {
			where: {
				type: 'updating',
			},
		} );
		if ( status ) {
			status.value = false;
			await this.processingRepository.update( status );
		}

		logger.debug( 'Finished updating Eras' );
	}

	// Collect unlocked validators, rewards and marked transfers.
	public async updateEraCirculatingSupply( era: Era ): Promise<void> {
		let circulatingSupply = BigInt( 0 );

		// Get all transfers marked as "approved" which means they should be counted as a part
		// of Circulating Supply.
		const approvedUnlocks = await this.transferRepository.find( {
			where: {
				eraId: {
					lte: era.id,
				},
				approved: true,
			},
			fields: ['amount'],
		} );

		// Sum all amounts of found transfers.
		circulatingSupply += approvedUnlocks.reduce( ( a: bigint, b: Transfer ) => {
			return a + BigInt( b.amount );
		}, BigInt( 0 ) );

		let circulatingSupplyDenominated = Math.round( Number( circulatingSupply / BigInt( 1000000000 ) ) );

		// Get validators unlock schedule
		const unlockedValidators = await this.validatorsUnlockRepository.find( {
			where: {
				timestamp: {
					lte: era.end ? era.end : moment( era.start ).add( 2, 'hours' ).toISOString(),
				},
			},
		} );

		// Get the sum of validators unlock to the circulating supply.
		let unlockedValidatorsAmount = Math.round( Number( unlockedValidators.reduce( ( a: bigint, b: ValidatorsUnlock ) => {
			return BigInt( a ) + BigInt( b.amount );
		}, BigInt( 0 ) ) / BigInt( 1000000000 ) ) );

		// Add unlocked validators amount.
		circulatingSupplyDenominated += unlockedValidatorsAmount;

		// Calculate the percentage of the rewards that go to circulating supply.
		const allRewards = Number( era.totalSupply ) - Number( networks.genesis_total_supply );
		const releasedRewards = ( unlockedValidatorsAmount / networks.genesis_validators_weights_total ) * allRewards;

		// Add rewards.
		circulatingSupplyDenominated += releasedRewards;

		// Update Era with the calculated amount.
		await this.eraRepository.updateById( era.id, {
			circulatingSupply: BigInt( Math.round( circulatingSupplyDenominated ) ),
		} );
	}
}
