import { Filter, repository } from '@loopback/repository';
import { get, getModelSchemaRef, param, response } from '@loopback/rest';
import moment from 'moment';
import { NotFound } from '../errors/errors';
import { Block, Era } from '../models';
import { BlockRepository, EraRepository } from '../repositories';

export class BlockController {
	constructor(
		@repository( BlockRepository )
		public blocksRepository: BlockRepository,
		@repository( EraRepository )
		public eraRepository: EraRepository,
	) {
	}

	@get( '/block' )
	@response( 200, {
		description: `Last block or a block specified by blockHeight.`,
		content: {
			'application/json': {
				schema: getModelSchemaRef( Block, { includeRelations: false } ),
			},
		},
	} )
	async find(
		@param.query.number( 'blockHeight' ) blockHeight?: number,
	): Promise<Block> {
		let filter: Filter<Block> = {
			limit: 1,
			order: ['blockHeight DESC'],
		};
		if ( blockHeight !== undefined ) {
			filter.where = {
				blockHeight: blockHeight,
			};
		}
		const block: Block | null = await this.blocksRepository.findOne( filter );

		if ( block ) {
			const circulatingSupply: bigint = await this._getLastCirculatingSupply( block );
			block.circulatingSupply = Number( circulatingSupply );

			const era: Era | null = await this.eraRepository.findOne( {
				where: { id: block.eraId },
			} );
			if ( era ) {
				block.validatorsWeights = era.validatorsWeights;
				block.circulatingSupply = era.circulatingSupply;
			}

			if ( block.blockHeight ) {
				const prevBlock = await this.blocksRepository.findOne( {
					where: { blockHeight: block.blockHeight - 1 },
					fields: ['timestamp'],
				} );

				if ( prevBlock ) {
					block.prevBlockTime = moment( block.timestamp )
						.diff( prevBlock?.timestamp, 'milliseconds' );
				}
			}
		} else {
			throw new NotFound();
		}

		return Object.assign( {}, block );
	}

	@get( 'block/circulating' )
	@response( 200, {
		description: `Most recent Circulating Supply of the last completed Era when called without params.
        Can be queried by "blockHeight"`,
		content: {
			'application/json': {},
		},
	} )
	async circulating(
		@param.query.number( 'blockHeight' ) blockHeight?: number,
	): Promise<string> {
		let filter: Filter<Era> = {
			limit: 1,
			order: ['blockHeight DESC'],
		};
		if ( blockHeight !== undefined ) {
			filter.where = {
				blockHeight: blockHeight,
			};
		}
		const block: Block | null = await this.blocksRepository.findOne( filter );
		if ( !block ) {
			throw new NotFound();
		}
		return ( await this._getLastCirculatingSupply( block ) ).toString();
	}

	@get( 'block/total' )
	@response( 200, {
		description: `Most recent Total Supply of the last completed Era when called without params.
        Can be queried by "blockHeight"`,
		content: {
			'application/json': {},
		},
	} )
	async total(
		@param.query.number( 'blockHeight' ) blockHeight?: number,
	): Promise<string> {
		let filter: Filter<Block> = {
			limit: 1,
			order: ['blockHeight DESC'],
		};
		if ( blockHeight !== undefined ) {
			filter.where = {
				blockHeight: blockHeight,
			};
		}
		const lastRecord = await this.blocksRepository.findOne( filter )
			.catch( error => {
			} );

		if ( !lastRecord ) {
			throw new NotFound();
		}
		return lastRecord.totalSupply.toString();
	}

	private async _getLastCirculatingSupply( block: Partial<Block> ): Promise<bigint> {
		let circulatingSupply = BigInt( 0 );
		if ( block && block.eraId ) {
			const blockEra = await this.eraRepository.findOne( {
				where: { id: block.eraId },
			} );
			if ( blockEra && blockEra.circulatingSupply ) {
				circulatingSupply = blockEra.circulatingSupply;
			}
		}
		return circulatingSupply;
	}
}
