import { Entity } from '@loopback/repository';
export declare class Era extends Entity {
    id: number;
    startBlock: number;
    transfersCount: number;
    deploysCount: number;
    endBlock?: number;
    start: string;
    end?: string;
    circulatingSupply: bigint;
    validatorsWeights: bigint;
    totalSupply: bigint;
    validatorsRewards: bigint;
    delegatorsRewards: bigint;
    rewards: bigint;
    validatorsCount: number;
    delegatorsCount: number;
    stakedThisEra: bigint;
    undelegatedThisEra: bigint;
    stakedDiffThisEra: bigint;
    stakedDiffSinceGenesis: bigint;
    [prop: string]: any;
    constructor(data?: Partial<Era>);
}
export interface EraRelations {
}
export declare type EraWithRelations = Era & EraRelations;
