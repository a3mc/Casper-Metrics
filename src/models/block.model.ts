import { Entity, model, property } from '@loopback/repository';

@model()
export class Block extends Entity {
    @property( {
        type: 'number',
        required: true,
        precision: 10,
        scale: 0,
        id: 1,
        mysql: {
            columnName: 'id',
            dataType: 'int',
            dataLength: null,
            dataPrecision: 10,
            dataScale: 0,
            nullable: 'N'
        },
    } )
    blockHeight: number;

    @property( {
        type: 'number',
        required: true,
        precision: 10,
        scale: 0,
        mysql: {
            columnName: 'era_id',
            dataType: 'int',
            dataLength: null,
            dataPrecision: 10,
            dataScale: 0,
            nullable: 'N'
        },
    } )
    eraId: number;

    @property( {
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'circulating_supply',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    } )
    circulatingSupply: bigint|number;

    @property( {
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'validators_weight',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    } )
    validatorsWeights: bigint;

    @property( {
        type: 'Number',
        required: true,
        mysql: {
            columnName: 'total_supply',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        },
    } )
    totalSupply: bigint;

    @property( {
        type: 'string',
        required: true,
        length: 64,
        mysql: {
            columnName: 'state_root_hash',
            dataType: 'varchar',
            dataLength: 64,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        },
    } )
    stateRootHash: string;

    @property( {
        type: 'number',
        required: false,
        precision: 10,
        scale: 0,
        mysql: {
            columnName: 'transfers_count',
            dataType: 'int',
            dataLength: null,
            dataPrecision: 10,
            dataScale: 0,
            nullable: 'N',
            default: 0,
        },
    } )
    transfersCount: number;

    @property( {
        type: 'number',
        required: false,
        precision: 10,
        scale: 0,
        mysql: {
            columnName: 'deploys_count',
            dataType: 'int',
            dataLength: null,
            dataPrecision: 10,
            dataScale: 0,
            nullable: 'N',
            default: 0,
        },
    } )
    deploysCount: number;

    @property( {
        type: 'Number',
        required: true,
        mysql: {
            columnName: 'staked_this_block',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        },
    } )
    stakedThisBlock: bigint;

    @property( {
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'next_era_validators_weights',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    } )
    nextEraValidatorsWeights: bigint;

    @property( {
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'validators_rewards',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    } )
    validatorsRewards: bigint;

    @property( {
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'delegators_rewards',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    } )
    delegatorsRewards: bigint;

    @property( {
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'rewards',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    } )
    rewards: bigint;

    @property( {
        type: 'number',
        required: false,
        precision: 10,
        scale: 0,
        mysql: {
            columnName: 'validators_count',
            dataType: 'int',
            dataLength: null,
            dataPrecision: 10,
            dataScale: 0,
            nullable: 'N',
            default: 0,
        },
    } )
    validatorsCount: number;

    @property( {
        type: 'number',
        required: false,
        precision: 10,
        scale: 0,
        mysql: {
            columnName: 'delegators_count',
            dataType: 'int',
            dataLength: null,
            dataPrecision: 10,
            dataScale: 0,
            nullable: 'N',
            default: 0,
        },
    } )
    delegatorsCount: number;

    @property( {
        type: 'boolean',
        required: false,
        mysql: {
            columnName: 'switch',
            dataType: 'Boolean',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: false
        },
    } )
    switch: boolean;

    @property( {
        type: 'Number',
        required: true,
        mysql: {
            columnName: 'unstaked_this_block',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N'
        },
    } )
    undelegatedThisBlock: bigint;

    @property( {
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'staked_diff_this_block',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    } )
    stakedDiffThisBlock: bigint;

    @property( {
        type: 'Number',
        required: false,
        mysql: {
            columnName: 'staked_diff_since_genesis',
            dataType: 'bigint',
            dataLength: null,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: 0,
        },
    } )
    stakedDiffSinceGenesis: bigint;

    @property( {
        type: 'string',
        required: false,
        length: 64,
        mysql: {
            columnName: 'exact_staked_diff_since_genesis',
            dataType: 'varchar',
            dataLength: 64,
            dataPrecision: null,
            dataScale: null,
            nullable: 'N',
            default: '0',
        },
    } )
    stakedDiffSinceGenesisMotes: string;

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

    // Define well-known properties here

    // Indexer property to allow additional data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [prop: string]: any;

    constructor( data?: Partial<Block> ) {
        super( data );
    }
}
