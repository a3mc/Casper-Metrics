import { authenticate } from '@loopback/authentication';
import { Count, CountSchema, Filter, FilterExcludingWhere, repository, Where } from '@loopback/repository';
import { del, get, getModelSchemaRef, oas, OperationVisibility, param, patch, post, put, requestBody, response } from '@loopback/rest';
import { KnownAccount } from '../models';
import { KnownAccountRepository } from '../repositories';

@oas.visibility( OperationVisibility.UNDOCUMENTED )
@authenticate( 'jwt' )
export class KnownAccountController {
	constructor(
		@repository( KnownAccountRepository )
		public knownAccountsRepository: KnownAccountRepository,
	) {
	}

	@post( '/known-account' )
	@response( 200, {
		description: 'KnownAccount model instance',
		content: { 'application/json': { schema: getModelSchemaRef( KnownAccount ) } },
	} )
	async create(
		@requestBody( {
			content: {
				'application/json': {
					schema: getModelSchemaRef( KnownAccount, {
						title: 'NewKnownAccount',
						exclude: ['id'],
					} ),
				},
			},
		} )
			knownAccounts: Omit<KnownAccount, 'id'>,
	): Promise<KnownAccount> {
		return this.knownAccountsRepository.create( knownAccounts );
	}

	@get( '/known-account/count' )
	@response( 200, {
		description: 'KnownAccount model count',
		content: { 'application/json': { schema: CountSchema } },
	} )
	async count(
		@param.where( KnownAccount ) where?: Where<KnownAccount>,
	): Promise<Count> {
		return this.knownAccountsRepository.count( where );
	}

	@get( '/known-account' )
	@response( 200, {
		description: 'Array of KnownAccount model instances',
		content: {
			'application/json': {
				schema: {
					type: 'array',
					items: getModelSchemaRef( KnownAccount, { includeRelations: true } ),
				},
			},
		},
	} )
	async find(
		@param.filter( KnownAccount ) filter?: Filter<KnownAccount>,
	): Promise<KnownAccount[]> {
		return this.knownAccountsRepository.find( filter );
	}

	@patch( '/known-account' )
	@response( 200, {
		description: 'KnownAccount PATCH success count',
		content: { 'application/json': { schema: CountSchema } },
	} )
	async updateAll(
		@requestBody( {
			content: {
				'application/json': {
					schema: getModelSchemaRef( KnownAccount, { partial: true } ),
				},
			},
		} )
			knownAccounts: KnownAccount,
		@param.where( KnownAccount ) where?: Where<KnownAccount>,
	): Promise<Count> {
		return this.knownAccountsRepository.updateAll( knownAccounts, where );
	}

	@get( '/known-account/{id}' )
	@response( 200, {
		description: 'KnownAccount model instance',
		content: {
			'application/json': {
				schema: getModelSchemaRef( KnownAccount, { includeRelations: true } ),
			},
		},
	} )
	async findById(
		@param.path.number( 'id' ) id: number,
		@param.filter( KnownAccount, { exclude: 'where' } ) filter?: FilterExcludingWhere<KnownAccount>,
	): Promise<KnownAccount> {
		return this.knownAccountsRepository.findById( id, filter );
	}

	@patch( '/known-account/{id}' )
	@response( 204, {
		description: 'KnownAccount PATCH success',
	} )
	async updateById(
		@param.path.number( 'id' ) id: number,
		@requestBody( {
			content: {
				'application/json': {
					schema: getModelSchemaRef( KnownAccount, { partial: true } ),
				},
			},
		} )
			knownAccounts: KnownAccount,
	): Promise<void> {
		await this.knownAccountsRepository.updateById( id, knownAccounts );
	}

	@put( '/known-account/{id}' )
	@response( 204, {
		description: 'KnownAccount PUT success',
	} )
	async replaceById(
		@param.path.number( 'id' ) id: number,
		@requestBody() knownAccounts: KnownAccount,
	): Promise<void> {
		await this.knownAccountsRepository.replaceById( id, knownAccounts );
	}

	@del( '/known-account/{id}' )
	@response( 204, {
		description: 'KnownAccount DELETE success',
	} )
	async deleteById( @param.path.number( 'id' ) id: number ): Promise<void> {
		await this.knownAccountsRepository.deleteById( id );
	}
}
