import { authenticate } from '@loopback/authentication';
import { repository } from '@loopback/repository';
import { get, getModelSchemaRef, oas, OperationVisibility, param, post, requestBody, response } from '@loopback/rest';
import { AdminLog } from '../models';
import { AdminLogRepository } from '../repositories';

@oas.visibility( OperationVisibility.UNDOCUMENTED )
@authenticate( { strategy: 'jwt' } )
export class LogController {
	constructor(
		@repository( AdminLogRepository )
		public adminLogRepository: AdminLogRepository,
	) {
	}

	@post( '/admin-logs' )
	@response( 200, {
		description: 'AdminLog model instance',
		content: { 'application/json': { schema: getModelSchemaRef( AdminLog ) } },
	} )
	async create(
		@requestBody( {
			content: {
				'application/json': {
					schema: getModelSchemaRef( AdminLog, {
						title: 'NewAdminLog',
						exclude: ['id'],
					} ),
				},
			},
		} )
			adminLog: Omit<AdminLog, 'id'>,
	): Promise<AdminLog> {
		return this.adminLogRepository.create( adminLog );
	}

	@get( '/admin-logs' )
	@response( 200, {
		description: 'Array of AdminLog model instances',
		content: {
			'application/json': {
				schema: {
					type: 'array',
					items: getModelSchemaRef( AdminLog, { includeRelations: true } ),
				},
			},
		},
	} )
	async findAll(
		@param.query.number( 'perPage' ) perPage: number = 15,
		@param.query.number( 'page' ) page: number = 1,
	): Promise<any> {
		const logs = await this.adminLogRepository.find( {
			order: ['id DESC'],
			skip: ( page - 1 ) * perPage,
			limit: perPage,
			fields: ['id', 'userName', 'userEmail', 'date', 'action'],
		} );

		const count = await this.adminLogRepository.count();

		return {
			total: count.count,
			data: logs,
			page: page,
			perPage: perPage,
		};
	}

	@get( '/admin-logs/{id}' )
	@response( 200, {
		description: 'Array of AdminLog model instances',
		content: {
			'application/json': {
				schema: {
					type: 'array',
					items: getModelSchemaRef( AdminLog, { includeRelations: false } ),
				},
			},
		},
	} )
	async find(
		@param.path.number( 'id' ) id: number,
	): Promise<AdminLog> {
		return this.adminLogRepository.findById( id );
	}
}
