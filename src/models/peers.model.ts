import { Entity, model, property } from '@loopback/repository';

@model( { settings: { strict: true } } )
export class Peers extends Entity {
	@property( {
		type: 'number',
		id: true,
		generated: true,
	} )
	id?: number;

	@property( {
		type: 'string',
		required: true,
	} )
	ip: string;

	@property( {
		type: 'boolean',
	} )
	bogon: boolean;

	@property( {
		type: 'string',
	} )
	hostname?: string;

	@property( {
		type: 'string',
	} )
	city?: string;

	@property( {
		type: 'string',
	} )
	region?: string;

	@property( {
		type: 'string',
	} )
	country?: string;

	@property( {
		type: 'string',
	} )
	loc?: string;

	@property( {
		type: 'string',
	} )
	org?: string;

	@property( {
		type: 'string',
	} )
	postal?: string;

	@property( {
		type: 'string',
	} )
	timezone?: string;

	@property( {
		type: 'date',
		required: true,
	} )
	catch_time: string;

	@property( {
		type: 'date',
	} )
	added: string;

	@property( {
		type: 'string',
	} )
	api_version?: string;

	@property( {
		type: 'string',
	} )
	mission?: string;

	@property( {
		type: 'string',
	} )
	public_key?: string;

	@property( {
		type: 'string',
	} )
	rpc?: string;

	@property( {
		type: 'string',
	} )
	status?: string;

	@property( {
		type: 'string',
	} )
	metrics?: string;

	@property( {
		type: 'string',
	} )
	errors?: string;

	@property( {
		type: 'string',
		required: true,
	} )
	peer_ip: string;

	// Define well-known properties here

	// Indexer property to allow additional data
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[prop: string]: any;

	constructor( data?: Partial<Peers> ) {
		super( data );
	}
}

export interface PeersRelations {
	// describe navigational properties here
}

export type PeersWithRelations = Peers & PeersRelations;
