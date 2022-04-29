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
		await this._setStatus( 100 );
		logger.debug( 'Updating Eras Circulating Supply' );

		// Update each era to store calculated circulating supply.
		// New eras will be updated automatically.
		const eras = await this.eraRepository.find( {
			fields: ['id', 'start', 'end', 'totalSupply', 'validatorsWeights'],
		} );

		let eraCounter = 0;

		const processTimer = setInterval( () => {
			this._setStatus( 100 - Math.round( ( 100 / eras.length ) * eraCounter ) );
		}, 1000 );

		for ( const era of eras ) {
			await this.updateEraCirculatingSupply( era );
			eraCounter ++;
		}

		clearInterval( processTimer );
		await this._setStatus( 0 );

		logger.debug( 'Finished updating Eras' );
	}

	// Collect unlocked validators, rewards and marked transfers.
	public async updateEraCirculatingSupply( era: Era ): Promise<void> {
		let transfersSupply = BigInt( 0 );
		let prevEraTransferSupply = BigInt( 0 )

		// Get all transfers marked as "approved" which means they should be counted as a part
		// of Circulating Supply.
		const approvedUnlocks = await this.transferRepository.find( {
			where: {
				eraId: era.id,
				approved: true,
			},
			fields: ['amount'],
		} );

		// Sum all amounts of found transfers.
		transfersSupply += this._denominate( approvedUnlocks.reduce( ( a: bigint, b: Transfer ) => {
			return a + BigInt( b.amount );
		}, BigInt( 0 ) ) );

		if ( await this.eraRepository.exists( era.id - 1 ) ) {
			const prevEra = await this.eraRepository.findById( era.id - 1 );
			prevEraTransferSupply = BigInt( prevEra.transfersCirculatingSupply );
		}

		// Get validators unlock schedule
		const unlockedValidators = await this.validatorsUnlockRepository.find( {
			where: {
				timestamp: {
					lte: era.end ? era.end : moment( era.start ).add( 2, 'hours' ).toISOString(),
				},
			},
		} );

		// Get the sum of validators unlock to the circulating supply.
		let unlockedValidatorsAmount = this._denominate( unlockedValidators.reduce( ( a: bigint, b: ValidatorsUnlock ) => {
			return BigInt( a ) + BigInt( b.amount );
		}, BigInt( 0 ) ) );

		// Calculate the percentage of the rewards that go to circulating supply.
		const allRewards = Number( era.totalSupply ) - Number( networks.genesis_total_supply );
		let releasedRewards = BigInt( allRewards );

		// We consider all rewards being a part of Circulating supply after the first 90 days validators unlock.
		if ( era.id < 1235 ) {
			releasedRewards = BigInt(
				Math.round( ( Number( unlockedValidatorsAmount ) / networks.genesis_validators_weights_total ) * allRewards )
			);
		}

		const circulatingSupply = prevEraTransferSupply + transfersSupply + unlockedValidatorsAmount + releasedRewards;
		const transfersCirculatingSupply = prevEraTransferSupply + transfersSupply;

		// Update Era with the calculated amount.
		await this.eraRepository.updateById( era.id, {
			circulatingSupply: circulatingSupply,
			transfersCirculatingSupply: transfersCirculatingSupply,
			validatorsCirculatingSupply: unlockedValidatorsAmount,
			rewardsCirculatingSupply: releasedRewards
		} );
	}

	private async _setStatus( value: number ): Promise<void> {
		// Set lock status while processing
		let status = await this.processingRepository.findOne( {
			where: {
				type: 'updating',
			},
		} );
		if ( status ) {
			status.value = value;
			await this.processingRepository.update( status );
		} else {
			await this.processingRepository.create(
				{
					type: 'updating',
					value: value,
				},
			);
		}
	}

	private _denominate( amount: bigint ): bigint {
		return BigInt( Math.round( Number( amount ) / 1000000000  ) );
	}
}
