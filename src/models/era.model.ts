import { Entity, model, property } from '@loopback/repository';

// Automatically generated model by lb4-cli. Each property is store in a db and accessible with a related repository.
// Please refer to the Loopback docs on how Models work.
@model()
export class Era extends Entity {
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
	id: number;

	@property( {
		type: 'number',
		required: true,
		precision: 10,
		scale: 0,
		mysql: {
			columnName: 'start_block',
			dataType: 'int',
			dataLength: null,
			dataPrecision: 10,
			dataScale: 0,
			nullable: 'N',
		},
	} )
	startBlock: number;

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
		type: 'number',
		required: false,
		precision: 10,
		scale: 0,
		mysql: {
			columnName: 'end_block',
			dataType: 'int',
			dataLength: null,
			dataPrecision: 10,
			dataScale: 0,
			nullable: 'Y',
		},
	} )
	endBlock?: number;

	@property( {
		type: 'date',
		required: true,
		mysql: {
			columnName: 'start',
			dataType: 'timestamp(3)',
			nullable: 'N',
		},
	} )
	start: string;

	@property( {
		type: 'date',
		required: false,
		mysql: {
			columnName: 'end',
			dataType: 'timestamp(3)',
			nullable: 'Y',
		},
	} )
	end?: string;

	@property( {
		type: 'Number',
		required: true,
		mysql: {
			columnName: 'circulating_supply',
			dataType: 'bigint',
			dataLength: null,
			dataPrecision: null,
			dataScale: null,
			nullable: 'N',
		},
	} )
	circulatingSupply: bigint;

	@property( {
		type: 'Number',
		required: false,
		default: 0,
		mysql: {
			columnName: 'validators_circulating_supply',
			dataType: 'bigint',
			dataLength: null,
			dataPrecision: null,
			dataScale: null,
			nullable: 'N',
		},
	} )
	validatorsCirculatingSupply?: bigint;

	@property( {
		type: 'Number',
		required: false,
		default: 0,
		mysql: {
			columnName: 'transfers_circulating_supply',
			dataType: 'bigint',
			dataLength: null,
			dataPrecision: null,
			dataScale: null,
			nullable: 'N',
		},
	} )
	transfersCirculatingSupply?: bigint;

	@property( {
		type: 'Number',
		required: false,
		default: 0,
		mysql: {
			columnName: 'rewards_circulating_supply',
			dataType: 'bigint',
			dataLength: null,
			dataPrecision: null,
			dataScale: null,
			nullable: 'N',
		},
	} )
	rewardsCirculatingSupply?: bigint;

	@property( {
		type: 'Number',
		required: true,
		mysql: {
			columnName: 'validators_weights',
			dataType: 'bigint',
			dataPrecision: null,
			dataScale: null,
			nullable: 'N',
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
			nullable: 'N',
		},
	} )
	totalSupply: bigint;

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
		type: 'Number',
		required: false,
		mysql: {
			columnName: 'staked_this_era',
			dataType: 'bigint',
			dataLength: null,
			dataPrecision: null,
			dataScale: null,
			nullable: 'N',
			default: 0,
		},
	} )
	stakedThisEra: bigint;

	@property( {
		type: 'Number',
		required: false,
		mysql: {
			columnName: 'unstaked_this_era',
			dataType: 'bigint',
			dataLength: null,
			dataPrecision: null,
			dataScale: null,
			nullable: 'N',
			default: 0,
		},
	} )
	undelegatedThisEra: bigint;

	@property( {
		type: 'Number',
		required: false,
		mysql: {
			columnName: 'staked_diff_this_era',
			dataType: 'bigint',
			dataLength: null,
			dataPrecision: null,
			dataScale: null,
			nullable: 'N',
			default: 0,
		},
	} )
	stakedDiffThisEra: bigint;

	// Define well-known properties here

	// Indexer property to allow additional data
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[prop: string]: any;

	constructor( data?: Partial<Era> ) {
		super( data );
	}
}

export interface EraRelations {
	// describe navigational properties here
}

export type EraWithRelations = Era & EraRelations;
