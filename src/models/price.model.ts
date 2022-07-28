import { Entity, model, property } from '@loopback/repository';

// Automatically generated model by lb4-cli. Each property is store in a db and accessible with a related repository.
// Please refer to the Loopback docs on how Models work.
@model()
export class Price extends Entity {
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
		precision: 10,
		scale: 0,
		mysql: {
			columnName: 'open',
			dataType: 'float',
			dataLength: null,
			dataPrecision: 10,
			dataScale: 0,
			nullable: 'N',
			default: 0,
		},
	} )
	open: number;

	@property( {
		type: 'number',
		required: true,
		precision: 10,
		scale: 0,
		mysql: {
			columnName: 'close',
			dataType: 'float',
			dataLength: null,
			dataPrecision: 10,
			dataScale: 0,
			nullable: 'N',
			default: 0,
		},
	} )
	close: number;

	@property( {
		type: 'number',
		required: true,
		precision: 10,
		scale: 0,
		mysql: {
			columnName: 'high',
			dataType: 'float',
			dataLength: null,
			dataPrecision: 10,
			dataScale: 0,
			nullable: 'N',
			default: 0,
		},
	} )
	high: number;

	@property( {
		type: 'number',
		required: true,
		precision: 10,
		scale: 0,
		mysql: {
			columnName: 'low',
			dataType: 'float',
			dataLength: null,
			dataPrecision: 10,
			dataScale: 0,
			nullable: 'N',
			default: 0,
		},
	} )
	low: number;

	@property( {
		type: 'number',
		required: true,
		precision: 10,
		scale: 0,
		mysql: {
			columnName: 'volumefrom',
			dataType: 'float',
			dataLength: null,
			dataPrecision: 10,
			dataScale: 0,
			nullable: 'N',
			default: 0,
		},
	} )
	volumeFrom: number;

	@property( {
		type: 'number',
		required: true,
		precision: 10,
		scale: 0,
		mysql: {
			columnName: 'volumeto',
			dataType: 'float',
			dataLength: null,
			dataPrecision: 10,
			dataScale: 0,
			nullable: 'N',
			default: 0,
		},
	} )
	volumeTo: number;

	constructor( data?: Partial<Price> ) {
		super( data );
	}
}

export interface PriceRelations {
	// describe navigational properties here
}

export type PriceWithRelations = Price & PriceRelations;
