import { Entity, model, property } from '@loopback/repository';

@model()
export class KnownAccount extends Entity {
    @property( {
        type: 'number',
        id: true,
        generated: true,
    } )
    id?: number;

    @property( {
        required: true,
        type: 'string',
        length: 80,
        mysql: {
            columnName: 'hash',
            dataType: 'varchar',
            dataLength: 80,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        }
    } )
    hash: string;

    @property( {
        type: 'string',
        length: 80,
        required: false,
        mysql: {
            columnName: 'hex',
            dataType: 'varchar',
            dataLength: 80,
            dataPrecision: null,
            dataScale: null,
            nullable: 'Y',
        }
    } )
    hex?: string;

    @property( {
        type: 'string',
        length: 32,
        required: false,
        mysql: {
            columnName: 'name',
            dataType: 'varchar',
            dataLength: 32,
            dataPrecision: null,
            dataScale: null,
            nullable: 'Y',
        }
    } )
    name?: string;

    @property( {
        type: 'string',
        required: false,
        length: 255,
        mysql: {
            columnName: 'comment',
            dataType: 'varchar',
            dataLength: 255,
            dataPrecision: null,
            dataScale: null,
            nullable: 'Y',
        }
    } )
    comment?: string;

    constructor( data?: Partial<KnownAccount> ) {
        super( data );
    }
}
