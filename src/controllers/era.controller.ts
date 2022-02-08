import { Filter, repository } from '@loopback/repository';
import { get, getModelSchemaRef, param, response } from '@loopback/rest';
import { NotFound } from '../errors/errors';
import { Era } from '../models';
import { EraRepository } from '../repositories';

//@authenticate.skip()
export class EraController {
	constructor(
		@repository( EraRepository )
		public eraRepository: EraRepository,
	) {
	}

	@get( 'era/circulating' )
	@response( 200, {
		description: `Last Completed Era "Circulation Supply" when called without params.
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
        Order example: "id DESC". Max limit is 1000;
        `,
		content: {
			'application/json': {
				schema: {
					type: 'array',
					items: getModelSchemaRef( Era, { includeRelations: false } ),
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
	): Promise<Era[]> {
		let filter: Filter<Era> = {
			// TODO: Define a max limit.
			limit: limit ? Math.min( limit, 10000 ) : 1,
			order: order ? order : ['id DESC'],
			skip: ( id !== undefined || blockHeight !== undefined || timestamp ) ? 0 : 1,
			where: this._calcSupplyQueryFilter( id, blockHeight, timestamp ),
		};

		if ( skip ) {
			filter.skip = skip;
		}

		return this.eraRepository.find( filter );
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
