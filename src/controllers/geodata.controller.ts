import { Filter, repository } from '@loopback/repository';
import { get, getModelSchemaRef, param, response } from '@loopback/rest';
import { Peers } from '../models';
import { PeersRepository } from '../repositories';

export class GeodataController {
	constructor(
		@repository( PeersRepository )
		public peersRepository: PeersRepository,
	) {
	}

	@get( '/validators' )
	@response( 200, {
		description: 'Active validators',
		content: {
			'application/json': {
				schema: {
					type: 'array',
					items: getModelSchemaRef( Peers, {
						includeRelations: false,
						exclude: [
							'id', 'ip', 'bogon', 'version', 'catch_time', 'added', 'mission', 'rpc', 'status', 'metrics', 'errors', 'peer_ip',
						],
					} ),
				},
			},
		},
	} )
	async getValidators(
		@param.query.object( 'filter' ) customFilter: Filter<Peers> = {},
	): Promise<any[]> {
		const lastVersionResult = await this.peersRepository.find( {
			limit: 1,
			order: ['version DESC'],
			fields: ['version'],
		} );

		if ( lastVersionResult?.length ) {
			let filter = customFilter;
			if ( !filter.where ) {
				filter.where = {};
			}
			// @ts-ignore
			filter.where.mission = 'VALIDATOR';
			// @ts-ignore
			filter.where.version = lastVersionResult[0].version;
			if ( !filter.fields ) {
				filter.fields = ['performance', 'public_key', 'api_version', 'org', 'loc', 'city', 'region', 'country', 'postal', 'timezone'];
			}

			return this.peersRepository.find( filter );
		}
		return [];
	}

}
