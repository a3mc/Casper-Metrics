import { Entity, model, property } from '@loopback/repository';

@model()
export class Circulating extends Entity {
	@property( {
		type: 'number',
		id: true,
		generated: true,
	} )
	id?: number;

	@property( {
		type: 'date',
		required: true,
		mysql: {
			columnName: 'timestamp',
			dataType: 'timestamp',
			dataLength: null,
			dataPrecision: null,
			dataScale: null,
			nullable: 'N',
		},
	} )
	timestamp: string;

	@property( {
		type: 'number',
		required: true,
	} )
	blockHeight: number;

	@property( {
		type: 'number',
		required: true,
	} )
	eraId: number;

	@property( {
		type: 'string',
	} )
	unlock?: string;

	@property( {
		type: 'string',
	} )
	deployHash?: string;

	constructor( data?: Partial<Circulating> ) {
		super( data );
	}
}

export interface CirculatingRelations {
	// describe navigational properties here
}

export type CirculatingWithRelations = Circulating & CirculatingRelations;
