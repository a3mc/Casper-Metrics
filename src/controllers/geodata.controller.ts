import {
	Count,
	CountSchema,
	Filter,
	FilterExcludingWhere,
	repository,
	Where,
} from '@loopback/repository';
import {
	post,
	param,
	get,
	getModelSchemaRef,
	patch,
	put,
	del,
	requestBody,
	response,
} from '@loopback/rest';
import { Peers } from '../models';
import { PeersRepository } from '../repositories';
import { Validator } from '@loopback/rest/dist/coercion/validator';
import moment from 'moment';

export class GeodataController {
	constructor(
		@repository( PeersRepository )
		public peersRepository: PeersRepository,
	) {
	}

	@get( '/geodata/count' )
	@response( 200, {
		description: 'Peers model count',
		content: { 'application/json': { schema: CountSchema } },
	} )
	async count(
		@param.where( Peers ) where?: Where<Peers>,
	): Promise<Count> {
		return this.peersRepository.count( where );
	}

	@get( '/geodata' )
	@response( 200, {
		description: 'Array of Peers model instances',
		content: {
			'application/json': {
				schema: {
					type: 'array',
					items: getModelSchemaRef( Peers, { includeRelations: true } ),
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
					items: getModelSchemaRef( Peers, { includeRelations: true } ),
				},
			},
		},
	} )
	async getValidators(): Promise<any[]> {
		return this.peersRepository.find( {
			where: {
				mission: 'VALIDATOR',
				added: { gt: moment().add( -4, 'hours' ).format() }
			},
			fields: ['loc']
		} );
	}

	@get( '/geodata/{id}' )
	@response( 200, {
		description: 'Peers model instance',
		content: {
			'application/json': {
				schema: getModelSchemaRef( Peers, { includeRelations: true } ),
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
