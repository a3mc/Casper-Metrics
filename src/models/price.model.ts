import { Entity, model, property } from '@loopback/repository';

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
    } )
    price: number;

    @property( {
        type: 'number',
        required: true,
    } )
    volume: number;


    constructor( data?: Partial<Price> ) {
        super( data );
    }
}

export interface PriceRelations {
    // describe navigational properties here
}

export type PriceWithRelations = Price & PriceRelations;
