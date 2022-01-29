import { Entity, model, property } from '@loopback/repository';

@model()
export class User extends Entity {
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
    email: string;

    @property( {
        type: 'string',
        required: false,
    } )
    firstName?: string;

    @property( {
        type: 'string',
        required: false,
    } )
    lastName?: string;

    @property( {
        type: 'string',
        required: true,
    } )
    password: string;

    @property( {
        type: 'string',
        required: true,
    } )
    role: string;

    @property( {
        type: 'boolean',
        required: false,
        default: true,
    } )
    active?: boolean;

    @property( {
        type: 'boolean',
        required: false,
        default: false,
    } )
    fa?: boolean;

    @property( {
        type: 'string',
        required: false,
    } )
    faSecret?: string;

    constructor( data?: Partial<User> ) {
        super( data );
    }
}

export interface UserRelations {
    // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;
