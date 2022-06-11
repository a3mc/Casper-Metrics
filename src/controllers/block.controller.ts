import { Filter, repository } from '@loopback/repository';
import { get, getModelSchemaRef, param, response } from '@loopback/rest';
import moment from 'moment';
import { IncorrectData, NotFound } from '../errors/errors';
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
		description: `Last block or a block specified by blockHeight.
			Can also return a collection of blocks when a custom "Filter" is used.
			Please see the documentation for examples.`,
		content: {
			'application/json': {
				schema: {
					type: 'array',
					items: getModelSchemaRef( Block, { includeRelations: false } ),
					additionalProperties: true,
				},
			},
		},
	} )
	async find(
		@param.query.number( 'blockHeight' ) blockHeight?: number,
		@param.query.string( 'hash' ) blockHash?: string,
		@param.query.object( 'filter' ) customFilter?: Filter<Block>,
	): Promise<Block[]> {
		let filter: Filter<Block>;
		if ( customFilter ) {
			if ( !customFilter.limit || customFilter.limit > 10 ) {
				customFilter.limit = 10;
			}
			filter = customFilter;
		} else {
			filter = {
				limit: 1,
				order: ['blockHeight DESC'],
			};
			if ( blockHeight !== undefined ) {
				filter.where = {
					blockHeight: blockHeight,
				};
			} else if ( blockHash !== undefined ) {
				filter.where = {
					blockHash: blockHash,
				};
			}
		}

		const blocks: Block[] | null = await this.blocksRepository.find( filter ).catch( () => {
			throw new IncorrectData( 'Incorrect query' );
		} );

		let processedBlocks: any[] = [];

		if ( blocks.length ) {
			for ( const block of blocks ) {
				const era: Era | null = await this.eraRepository.findOne( {
					where: { id: block.eraId },
					fields: ['validatorsWeights', 'circulatingSupply'],
				} );
				if ( era ) {
					// @ts-ignore
					if ( !filter.fields || filter.fields.indexOf( 'validatorsWeights' ) > -1 ) {
						block.validatorsWeights = era.validatorsWeights;
					}
					// @ts-ignore
					if ( !filter.fields || filter.fields.indexOf( 'circulatingSupply' ) > -1 ) {
						block.circulatingSupply = era.circulatingSupply;
					}

				}

				block.prevBlockTime = 0;
				if ( block.blockHeight ) {
					const prevBlock = await this.blocksRepository.findOne( {
						where: { blockHeight: block.blockHeight - 1 },
						fields: ['timestamp'],
					} );

					if ( prevBlock ) {
						block.prevBlockTime = moment( block.timestamp )
							.diff( prevBlock.timestamp, 'milliseconds' );
					}
				}
				processedBlocks.push( Object.assign( {}, block ) );
			}
		} else {
			throw new NotFound();
		}

		return processedBlocks;
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
