import { Entity, model, property } from '@loopback/repository';

@model()
export class Processing extends Entity {
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
	type: string;

	@property( {
		type: 'boolean',
		required: true,
	} )
	value: boolean;

	constructor( data?: Partial<Processing> ) {
		super( data );
	}
}

export interface ProcessingRelations {
	// describe navigational properties here
}

export type ProcessingWithRelations = Processing & ProcessingRelations;
