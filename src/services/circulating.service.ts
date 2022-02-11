import { BindingScope, injectable } from '@loopback/core';
import { repository } from '@loopback/repository';
import moment from 'moment';
import { networks } from '../configs/networks';
import { Circulating, Era, Transfer, ValidatorsUnlock } from '../models';
import { BlockRepository, CirculatingRepository, EraRepository, TransferRepository, ValidatorsUnlockRepository } from '../repositories';

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
		@repository( CirculatingRepository )
		public circulatingRepository: CirculatingRepository,
	) {
	}

	public async calculateCirculatingSupply(): Promise<void> {
		const eras = await this.eraRepository.find( {
			fields: ['id', 'start', 'end', 'totalSupply'],
		} );
		for ( const era of eras ) {
			await this.updateEraCirculatingSupply( era );
		}
	}

	public async updateEraCirculatingSupply( era: Era ): Promise<void> {
		let circulatingSupply = BigInt( 0 );

		const approvedUnlocks = await this.transferRepository.find( {
			where: {
				eraId: {
					lte: era.id,
				},
				or: [
					{ approved : true },
					{ allOutbound: true },
				],
			},
		} );

		circulatingSupply += approvedUnlocks.reduce( ( a: bigint, b: Transfer ) => {
			return a + BigInt( b.amount );
		}, BigInt( 0 ) );

		const unlockedValidators = await this.validatorsUnlockRepository.find( {
			where: {
				and: [
					{ day: { gte: 0 } },
					{
						timestamp: {
							lte: era.end ? era.end : moment( era.start ).add( 2, 'hours' ).toISOString(),
						},
					},
				],
			},
		} );

		circulatingSupply += unlockedValidators.reduce( ( a: bigint, b: ValidatorsUnlock ) => {
			return BigInt( a ) + BigInt( b.amount );
		}, BigInt( 0 ) );

		const allRewards = Number( era.totalSupply ) - networks.genesis_total_supply;
		let circulatingSupplyDenominated = Number( circulatingSupply / BigInt( 1000000000 ) );
		const releasedRewards = allRewards * ( circulatingSupplyDenominated / networks.genesis_total_supply );
		circulatingSupplyDenominated += releasedRewards;

		await this.eraRepository.updateById( era.id, {
			circulatingSupply: BigInt( Math.round( circulatingSupplyDenominated ) ),
		} );
	}
}
