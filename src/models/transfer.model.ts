import { Entity, model, property } from '@loopback/repository';

@model()
export class Transfer extends Entity {
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
            nullable: 'N'
        },
    } )
    timestamp: string;

    @property( {
        type: 'number',
        required: true,
    } )
    depth: number;

    @property( {
        type: 'boolean',
        required: false,
        default: false,
    } )
    approved: boolean;

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
        required: true,
        length: 80,
        mysql: {
            columnName: 'deployhash',
            dataType: 'varchar',
            dataLength: 80,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        }
    } )
    deployHash: string;

    @property( {
        type: 'string',
        required: true,
        length: 80,
        mysql: {
            columnName: 'from',
            dataType: 'varchar',
            dataLength: 80,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        }
    } )
    from: string;

    @property( {
        type: 'string',
        required: true,
        length: 80,
        mysql: {
            columnName: 'fromhash',
            dataType: 'varchar',
            dataLength: 80,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        }
    } )
    fromHash: string;

    @property( {
        type: 'string',
        length: 80,
        mysql: {
            columnName: 'to',
            dataType: 'varchar',
            dataLength: 80,
            dataPrecision: null,
            dataScale: null,
            nullable: 'Y'
        }
    } )
    to?: string;

    @property( {
        type: 'string',
        required: true,
        length: 80,
        mysql: {
            columnName: 'tohash',
            dataType: 'varchar',
            dataLength: 80,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        }
    } )
    toHash: string;

    @property( {
        type: 'string',
        required: true,
        length: 25,
        mysql: {
            columnName: 'amount',
            dataType: 'varchar',
            dataLength: 25,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        }
    } )
    amount: string;

    constructor( data?: Partial<Transfer> ) {
        super( data );
    }
}
