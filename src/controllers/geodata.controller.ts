import { Filter, FilterExcludingWhere, repository } from '@loopback/repository';
import { param, get, getModelSchemaRef, response, oas, OperationVisibility } from '@loopback/rest';
import { Peers } from '../models';
import { PeersRepository } from '../repositories';
import moment from 'moment';

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

		if ( lastVersionResult.length ) {
			return this.peersRepository.find( {
				where: {
					mission: 'VALIDATOR',
					version: lastVersionResult,
				},
				fields: ['city','loc'],
			} );
		}
		return [];
	}

	@get( '/geodata/{id}' )
	@response( 200, {
		description: 'Peers model instance',
		content: {
			'application/json': {
				schema: getModelSchemaRef( Peers, { includeRelations: false } ),
			},
		},
	} )
	async findById(
		@param.path.number( 'id' ) id: number,
		@param.filter( Peers, { exclude: 'where' } ) filter?: FilterExcludingWhere<Peers>,
	): Promise<Peers> {
		return this.peersRepository.findById( id, filter );
	}
}
