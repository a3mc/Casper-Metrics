import { authenticate } from '@loopback/authentication';
import { repository } from '@loopback/repository';
import { get, getModelSchemaRef, oas, OperationVisibility, param, post, requestBody, response } from '@loopback/rest';
import { AdminLog } from '../models';
import { AdminLogRepository } from '../repositories';

// Admin-only REST API controller class for operations with Admin logs, served by the Loopback framework.
// Endpoints are protected with JWT strategy and not documented in the public OpenAPI spec.
@oas.visibility( OperationVisibility.UNDOCUMENTED )
@authenticate( { strategy: 'jwt' } )
export class LogController {
	constructor(
		@repository( AdminLogRepository )
		public adminLogRepository: AdminLogRepository,
	) {
	}

	// Returns the admin logs from the database.
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
		// It allows pagination to view more data.
		const logs = await this.adminLogRepository.find( {
			order: ['id DESC'],
			skip: ( page - 1 ) * perPage,
			limit: perPage,
			fields: ['id', 'userName', 'userEmail', 'date', 'action'],
		} );

		// Return the total of items for corrent pagination and more info.
		const count = await this.adminLogRepository.count();

		return {
			total: count.count,
			data: logs,
			page: page,
			perPage: perPage,
		};
	}

	// Get a specific log by id.
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
