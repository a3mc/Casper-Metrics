import { Entity, model, property } from '@loopback/repository';

// Automatically generated model by lb4-cli. Each property is store in a db and accessible with a related repository.
// Please refer to the Loopback docs on how Models work.
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
		type: 'number',
		required: true,
		default: 0,
	} )
	value: number;

	constructor( data?: Partial<Processing> ) {
		super( data );
	}
}

export interface ProcessingRelations {
	// describe navigational properties here
}

export type ProcessingWithRelations = Processing & ProcessingRelations;
