import { Entity, model, property } from '@loopback/repository';

@model()
export class Delegators extends Entity {
	@property( {
		type: 'number',
		id: true,
		generated: true,
	} )
	id?: number;

	@property( {
		type: 'number',
		required: true
	} )
	eraId: number;

	@property( {
		type: 'string',
		required: true,
		mysql: {
			columnName: 'validator',
			dataType: 'varchar',
			dataLength: 80,
			dataPrecision: null,
			dataScale: null,
			nullable: 'N',
		},
	} )
	validator: string;

	@property( {
		type: 'string',
		required: true,
		mysql: {
			columnName: 'delegator',
			dataType: 'varchar',
			dataLength: 80,
			dataPrecision: null,
			dataScale: null,
			nullable: 'N',
		},
	} )
	delegator: string;

	@property( {
		type: 'string',
		required: true,
		mysql: {
			columnName: 'amount',
			dataType: 'varchar',
			dataLength: 20,
			dataPrecision: null,
			dataScale: null,
			nullable: 'N',
		},
	} )
	amount: string;

	@property( {
		type: 'number',
		required: true,
		precision: 10,
		scale: 0,
		mysql: {
			columnName: 'usd_amount',
			dataType: 'float',
			dataLength: null,
			dataPrecision: 10,
			dataScale: 0,
			nullable: 'N',
			default: 0,
		},
	} )
	usdAmount: number;

	@property( {
		type: 'date',
		mysql: {
			columnName: 'created_at',
			dataType: 'timestamp',
			dataLength: null,
			dataPrecision: null,
			dataScale: null,
			nullable: 'N',
		},
	} )
	created_at?: string;

	constructor( data?: Partial<Delegators> ) {
		super( data );
	}
}

export interface DelegatorsRelations {
	// describe navigational properties here
}

export type DelegatorsWithRelations = Delegators & DelegatorsRelations;
