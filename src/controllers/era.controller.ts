import { inject } from '@loopback/core';
import { Filter, repository } from '@loopback/repository';
import { get, getModelSchemaRef, param, response, RestBindings } from '@loopback/rest';
import { Request } from 'express';
import { IncorrectData, NotFound } from '../errors/errors';
import { Era } from '../models';
import { EraRepository } from '../repositories';

// REST API controller class for operations with Eras, served by the Loopback framework.
// You can find more details about each endpoint in their descriptions and related schemas.
// Some not self-explanatory parts are covered with the additional comments.
export class EraController {
	constructor(
		@repository( EraRepository )
		public eraRepository: EraRepository,
	) {
	}

	// Endpoint for getting circulating supply
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

	// Get total supply for era.
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

	// Get an era or a range of eras. Custom filters can be used.
	@get( '/era' )
	@response( 200, {
		description: `Last Completed Era metrics when called without params.
        Can be queried by either "eraId", "blockHeight" or "timestamp" (e.g. "2021-04-09T09:31:36Z").
        Order example: "id DESC". Max limit is 1000 records,
        and 100 records in the Swagger UI to prevent browser from hanging when rendering.
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
		@inject( RestBindings.Http.REQUEST ) request: Request,
		@param.query.number( 'id' ) id?: number,
		@param.query.number( 'blockHeight' ) blockHeight?: number,
		@param.query.dateTime( 'timestamp' ) timestamp?: string,
		@param.query.number( 'limit' ) limit?: number,
		@param.query.string( 'order' ) order?: string[],
		@param.query.string( 'skip' ) skip?: number,
		@param.query.object( 'filter' ) customFilter?: Filter<Era>,
	): Promise<Era[]> {
		// Limit responses depending on how it was called.
		// @ts-ignore
		const maxLimit = request?.headers?.origin && request.headers.origin.indexOf( 'caspermetrics.io' ) > -1 ? 100 : 1000;

		// If a custom "filter" object is used it ignores and overrides other parameters.
		if ( customFilter ) {
			if ( !customFilter ) {
				throw new IncorrectData( 'Incorrect empty filter' );
			}
			if ( !customFilter.limit || customFilter.limit > maxLimit ) {
				customFilter.limit = maxLimit;
			}
			return this.eraRepository.find( customFilter ).catch( () => {
				throw new IncorrectData( 'Incorrect query' );
			} );
		}

		let filter: Filter<Era> = {
			// Defined the max limit of items to be returned.
			limit: limit ? Math.min( limit, skip == 0 && order ? 10000 : maxLimit ) : 1,
			order: order ? order : ['id DESC'],
			skip: ( id !== undefined || blockHeight !== undefined || timestamp ) ? 0 : 1,
			// Using a helper filter to find by block heights or timestamp
			where: this._calcSupplyQueryFilter( id, blockHeight, timestamp ),
		};

		if ( skip ) {
			filter.skip = skip;
		}

		return this.eraRepository.find( filter ).catch( () => {
			throw new IncorrectData( 'Incorrect query' );
		} );
	}

	// A helper method providing a search filter
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
