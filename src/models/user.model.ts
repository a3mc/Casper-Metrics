import { Entity, model, property } from '@loopback/repository';

@model()
export class User extends Entity {
	@property( {
		type: 'number',
		id: true,
		generated: true,
	} )
	id?: number;

	@property( {
		type: 'date',
		required: false,
	} )
	invitedAt?: string;

	@property( {
		type: 'string',
		required: false,
	} )
	inviteToken?: string;

	@property( {
		type: 'string',
		required: true,
	} )
	email: string;

	@property( {
		type: 'string',
		required: false,
	} )
	firstName: string;

	@property( {
		type: 'string',
		required: false,
	} )
	lastName: string;

	@property( {
		type: 'string',
		required: false,
	} )
	password?: string;

	@property( {
		type: 'string',
		required: true,
	} )
	role: string;

	@property( {
		type: 'boolean',
		required: false,
		default: false,
	} )
	active?: boolean;

	@property( {
		type: 'boolean',
		required: false,
		default: false,
	} )
	deleted?: boolean;

	@property( {
		type: 'string',
		required: false,
	} )
	faSecret?: string;

	@property( {
		type: 'string',
		required: false,
	} )
	test?: string;

	constructor( data?: Partial<User> ) {
		super( data );
	}
}

export interface UserRelations {
	// describe navigational properties here
}

export type UserWithRelations = User & UserRelations;
