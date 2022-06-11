import { Filter, repository } from '@loopback/repository';
import { get, getModelSchemaRef, param, response } from '@loopback/rest';
import { IncorrectData, NotFound } from '../errors/errors';
import { Era } from '../models';
import { EraRepository } from '../repositories';

export class EraController {
	constructor(
		@repository( EraRepository )
		public eraRepository: EraRepository,
	) {
	}

	@get( 'era/circulating' )
	@response( 200, {
		description: `Last Completed Era "Circulating Supply" when called without params.
        Era data is updated on the Switch Block.
        Can be queried by "eraId"`,
		content: {
			'application/json': {},
		},
	} )
	async circulating(
		@param.query.number( 'eraId' ) id?: number,
	): Promise<string> {
		let filter: Filter<Era> = {};
		if ( id !== undefined ) {
			filter.where = {
				id: id,
			};
		} else {
			filter.order = ['id DESC'],
				filter.skip = 1;
			filter.limit = 1;
		}
		const lastRecord = await this.eraRepository.findOne( filter )
			.catch( error => {
			} );

		if ( !lastRecord ) {
			throw new NotFound();
		}
		return lastRecord.circulatingSupply.toString();
	}

	@get( 'era/total' )
	@response( 200, {
		description: `Last Completed Era "Total Supply" when called without params.
        Era data is updated on the Switch Block.
        Can be queried by either "eraId"`,
		content: {
			'application/json': {},
		},
	} )
	async total(
		@param.query.number( 'eraId' ) id?: number,
	): Promise<string> {
		let filter: Filter<Era> = {};
		if ( id !== undefined ) {
			filter.where = {
				id: id,
			};
		} else {
			filter.order = ['id DESC'],
				filter.skip = 1;
			filter.limit = 1;
		}

		const lastRecord = await this.eraRepository.findOne( filter )
			.catch( error => {
			} );

		if ( !lastRecord ) {
			throw new NotFound();
		}
		return lastRecord.totalSupply.toString();
	}

	@get( '/era' )
	@response( 200, {
		description: `Last Completed Era metrics when called without params.
        Can be queried by either "eraId", "blockHeight" or "timestamp" (e.g. "2021-04-09T09:31:36Z").
        Order example: "id DESC". Max limit for simple queries is 10000 records (when used without a Custom Filter),
        but avoid using limits over 100 in the Swagger UI to prevent browser from hanging.
        "Filter" can be a custom JSON object. Please see the documentation for examples.
        `,
		content: {
			'application/json': {
				schema: {
					type: 'array',
					items: getModelSchemaRef( Era, { includeRelations: false } ),
					additionalProperties: false,
				},
			},
		},
	} )
	async find(
		@param.query.number( 'id' ) id?: number,
		@param.query.number( 'blockHeight' ) blockHeight?: number,
		@param.query.dateTime( 'timestamp' ) timestamp?: string,
		@param.query.number( 'limit' ) limit?: number,
		@param.query.string( 'order' ) order?: string[],
		@param.query.string( 'skip' ) skip?: number,
		@param.query.object( 'filter' ) customFilter?: Filter<Era>,
	): Promise<Era[]> {
		// If a custom "filter" object is used it ignores and overrides other parameters.
		if ( customFilter ) {
			if ( !customFilter ) {
				throw new IncorrectData( 'Incorrect empty filter' );
			}
			// Limit responses to 10 when using custom Filter
			if ( !customFilter.limit || customFilter.limit > 10 ) {
				customFilter.limit = 10;
			}
			return this.eraRepository.find( customFilter ).catch( () => {
				throw new IncorrectData( 'Incorrect query' );
			} );
		}

		let filter: Filter<Era> = {
			// TODO: Rename id to eraId for consistency.
			limit: limit ? Math.min( limit, 10000 ) : 1,
			order: order ? order : ['id DESC'],
			skip: ( id !== undefined || blockHeight !== undefined || timestamp ) ? 0 : 1,
			where: this._calcSupplyQueryFilter( id, blockHeight, timestamp ),
		};

		if ( skip ) {
			filter.skip = skip;
		}

		return this.eraRepository.find( filter ).catch( () => {
			throw new IncorrectData( 'Incorrect query' );
		} );
	}

	private _calcSupplyQueryFilter(
		id: number | undefined,
		blockHeight: number | undefined,
		timestamp: string | undefined,
	) {
		let where: any = {};
		if ( id !== undefined ) {
			where.id = id;
		} else if ( blockHeight !== undefined ) {
			where.and = [
				{
					startBlock: {
						lte: blockHeight,
					},
				},
				{
					or: [
						{
							endBlock: null,
						},
						{
							endBlock: {
								gte: blockHeight,
							},
						},
					],
				},
			];
		} else if ( timestamp ) {
			where.and = [
				{
					start: {
						lte: timestamp,
					},
				},
				{
					or: [
						{
							end: null,
						},
						{
							end: {
								gte: timestamp,
							},
						},
					],
				},
			];
		}
		return where;
	}
}
