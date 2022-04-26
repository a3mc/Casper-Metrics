import { Entity, model, property } from '@loopback/repository';

@model()
export class AdminLog extends Entity {
	@property( {
		type: 'number',
		id: true,
		generated: true,
	} )
	id?: number;

	@property( {
		type: 'date',
		required: true,
	} )
	date: string;

	@property( {
		type: 'number',
		required: true,
	} )
	userId: number;

	@property( {
		type: 'string',
	} )
	userName?: string;

	@property( {
		type: 'string',
		required: true,
	} )
	userEmail: string;

	@property( {
		type: 'string',
		required: true,
	} )
	action: string;

	@property( {
		type: 'string',
		required: false,
		default: '',
		mysql: {
			columnName: 'extra',
			dataType: 'longtext',
			nullable: 'N',
		},
	} )
	extra: string;

	constructor( data?: Partial<AdminLog> ) {
		super( data );
	}
}

export interface AdminLogRelations {
	// describe navigational properties here
}

export type AdminLogWithRelations = AdminLog & AdminLogRelations;
