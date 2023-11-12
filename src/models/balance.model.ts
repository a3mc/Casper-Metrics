import { Entity, model, property } from '@loopback/repository';

@model()
export class Balance extends Entity {
	@property( {
		type: 'number',
		id: true,
		generated: true,
		mysql: {
			columnName: 'id',
			dataType: 'int',
			dataLength: null,
			dataPrecision: 10,
			dataScale: 0,
			nullable: 'N',
		},
	} )
	id?: number;

	@property( {
		type: 'string',
		required: true,
		mysql: {
			columnName: 'account_hash',
			dataType: 'varchar',
			dataLength: 128,
			dataPrecision: null,
			dataScale: null,
			nullable: 'N',
		},
	} )
	account_hash: string;

	@property( {
		type: 'string',
		required: true,
		mysql: {
			columnName: 'amount',
			dataType: 'varchar',
			dataLength: 40,
			dataPrecision: null,
			dataScale: null,
			nullable: 'N',
		},
	} )
	amount: string;

	@property( {
		type: 'number',
		required: true,
		mysql: {
			columnName: 'denom_amount',
			dataType: 'bigint',
			dataLength: null,
			dataScale: 0,
			nullable: 'N',
		},
	} )
	denomAmount: number;

	@property( {
		type: 'number',
		required: true,
		mysql: {
			columnName: 'block_height',
			dataType: 'int',
			dataLength: null,
			dataPrecision: 10,
			dataScale: 0,
			nullable: 'N',
		},
	} )
	blockHeight: number;

	constructor( data?: Partial<Balance> ) {
		super( data );
	}
}

export interface BalanceRelations {
	// describe navigational properties here
}

export type BalanceWithRelations = Balance & BalanceRelations;
