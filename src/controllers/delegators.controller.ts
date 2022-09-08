import { repository } from '@loopback/repository';
import { get, getModelSchemaRef, param, response } from '@loopback/rest';
import { Delegators } from '../models';
import { DelegatorsRepository } from '../repositories';

export class DelegatorsController {
	constructor(
		@repository( DelegatorsRepository )
		public delegatorsRepository: DelegatorsRepository,
	) {
	}

	@get( '/delegators' )
	@response( 200, {
		description: 'Array of Delegators model instances',
		content: {
			'application/json': {
				schema: {
					type: 'array',
					items: getModelSchemaRef( Delegators, { includeRelations: false } ),
				},
			},
		},
	} )
	async find(
		@param.query.string( 'validator' ) validator: string,
		@param.query.string( 'delegator' ) delegator: string,
	): Promise<Delegators[]> {
		return this.delegatorsRepository.find( {
			where: {
				validator: validator,
				delegator: delegator,
			},
		} );
	}
}
