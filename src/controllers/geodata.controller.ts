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

	@oas.visibility( OperationVisibility.UNDOCUMENTED )
	@get( '/geodata' )
	@response( 200, {
		description: 'Array of Peers model instances',
		content: {
			'application/json': {
				schema: {
					type: 'array',
					items: getModelSchemaRef( Peers, { includeRelations: false } ),
				},
			},
		},
	} )
	async find(
		@param.filter( Peers ) filter?: Filter<Peers>,
	): Promise<Peers[]> {
		return this.peersRepository.find( filter );
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
		return this.peersRepository.find( {
			where: {
				mission: 'VALIDATOR',
				added: { gt: moment().add( -4, 'hours' ).format() },
			},
			fields: ['loc'],
		} );
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
