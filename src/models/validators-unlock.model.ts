import { Entity, model, property } from '@loopback/repository';

@model()
export class ValidatorsUnlock extends Entity {
    @property( {
        type: 'number',
        id: true,
        generated: true,
    } )
    id?: number;

    @property( {
        type: 'number',
        required: true,
    } )
    day: number;

    @property( {
        type: 'date',
        required: true,
        mysql: {
            columnName: 'timestamp',
            dataType: 'timestamp',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        },
    } )
    timestamp: string;

    @property( {
        type: 'string',
        required: true,
    } )
    amount: string;

    constructor( data?: Partial<ValidatorsUnlock> ) {
        super( data );
    }
}
