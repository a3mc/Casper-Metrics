import { inject } from '@loopback/core';
import { Filter, repository } from '@loopback/repository';
import { get, getModelSchemaRef, param, response, RestBindings } from '@loopback/rest';
import { Request } from 'express';
import moment from 'moment';
import { IncorrectData, NotFound } from '../errors/errors';
import { Block, Era } from '../models';
import { BlockRepository, EraRepository } from '../repositories';

// REST API controller class for operations with Blocks, served by the Loopback framework.
// You can find more details about each endpoint in their descriptions and related schemas.
// Some not self-explanatory parts are covered with the additional comments.
export class BlockController {
	// Requires Block and Era repositories to operate.
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
			Can also return a range of blocks when a custom "Filter" is used.
			Please see the documentation for the examples.`,
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
		@inject( RestBindings.Http.REQUEST ) request: Request,
		@param.query.number( 'blockHeight' ) blockHeight?: number,
		@param.query.string( 'hash' ) blockHash?: string,
		@param.query.object( 'filter' ) customFilter?: Filter<Block>,
	): Promise<Block[]> {
		let filter: Filter<Block>;
		if ( customFilter ) {
			// To prevent web interface from hanging when making huge calls from Swagger UI,
			// There's a limitation applied to the production domain.
			// Such large requests work fine when called without Swagger.
			// @ts-ignore
			const maxLimit = request?.headers?.origin && request.headers.origin.indexOf( 'caspermetrics.io' ) > -1 ? 100 : 1000;
			if ( !customFilter.limit || customFilter.limit > maxLimit ) {
				customFilter.limit = maxLimit;
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
				// Only query Era if no "fields" are not set, or they include weight or circulating.
				// That saves some resources  and makes large queries faster.
				if (
					!filter.fields ||
					// @ts-ignore
					filter.fields.indexOf( 'validatorsWeights' ) > -1 ||
					// @ts-ignore
					filter.fields.indexOf( 'circulatingSupply' ) > -1
				) {
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
				}

				// Get time difference only if needed, to speed up the response.
				// @ts-ignore
				if ( !filter || !filter.fields || filter.fields.indexOf( 'prevBlockTime' ) > -1 ) {
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
				}
				processedBlocks.push( Object.assign( {}, block ) );
			}
		} else {
			throw new NotFound();
		}

		return processedBlocks;
	}

	// Return circulating supply by calling the related Era
	@get( 'block/circulating' )
	@response( 200, {
		description: `Most recent Circulating Supply of the last completed Era when called without params.
        Can be queried by "blockHeight" or block "hash"`,
		content: {
			'application/json': {},
		},
	} )
	async circulating(
		@param.query.number( 'blockHeight' ) blockHeight?: number,
		@param.query.string( 'hash' ) blockHash?: string,
	): Promise<string> {
		let filter: Filter<Block> = {
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

		const block: Block | null = await this.blocksRepository.findOne( filter );
		if ( !block ) {
			throw new NotFound();
		}
		return ( await this._getLastCirculatingSupply( block ) ).toString();
	}

	// Return total supply of the last completed era by block height or hash.
	@get( 'block/total' )
	@response( 200, {
		description: `Most recent Total Supply of the last completed Era when called without params.
        Can be queried by "blockHeight" or block "hash"`,
		content: {
			'application/json': {},
		},
	} )
	async total(
		@param.query.number( 'blockHeight' ) blockHeight?: number,
		@param.query.string( 'hash' ) blockHash?: string,
	): Promise<string> {
		let filter: Filter<Block> = {
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
		const lastRecord = await this.blocksRepository.findOne( filter )
			.catch( error => {
			} );

		if ( !lastRecord ) {
			throw new NotFound();
		}
		return lastRecord.totalSupply.toString();
	}

	// Helper method to get data from the corresponding Era.
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
