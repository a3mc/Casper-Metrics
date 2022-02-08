import { Entity, model, property } from '@loopback/repository';

@model()
export class ValidatorsUnlockConstants extends Entity {
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
	unlock90: string;

	@property( {
		type: 'string',
		required: true,
	} )
	unlock365: string;

	constructor( data?: Partial<ValidatorsUnlockConstants> ) {
		super( data );
	}
}

export interface ValidatorsUnlockConstantsRelations {
	// describe navigational properties here
}

export type ValidatorsUnlockConstantsWithRelations = ValidatorsUnlockConstants & ValidatorsUnlockConstantsRelations;
