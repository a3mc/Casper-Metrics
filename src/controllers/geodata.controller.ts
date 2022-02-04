import { repository } from '@loopback/repository';
import { get, getModelSchemaRef, response } from '@loopback/rest';
import { Peers } from '../models';
import { PeersRepository } from '../repositories';

export class GeodataController {
	constructor(
		@repository( PeersRepository )
		public peersRepository: PeersRepository,
	) {
	}

	@get( '/geodata/validators' )
	@response( 200, {
		description: 'Active validators',
		content: {
			'application/json': {
				schema: {
					type: 'array',
					items: getModelSchemaRef( Peers, { includeRelations: false } ),
				},
			},
		},
	} )
	async getValidators(): Promise<any[]> {
		const lastVersionResult = await this.peersRepository.find( {
			limit: 1,
			order: ['version DESC'],
			fields: ['version'],
		} );

		if ( lastVersionResult?.length ) {
			return this.peersRepository.find( {
				where: {
					mission: 'VALIDATOR',
					version: lastVersionResult[0].version,
				},
				fields: ['city', 'loc'],
			} );
		}
		return [];
	}

}
