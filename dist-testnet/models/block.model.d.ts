import { Entity } from '@loopback/repository';
export declare class Block extends Entity {
    blockHeight: number;
    eraId: number;
    circulatingSupply: bigint | number;
    validatorsWeights: bigint;
    totalSupply: bigint;
    stateRootHash: string;
    transfersCount: number;
    deploysCount: number;
    stakedThisBlock: bigint;
    nextEraValidatorsWeights: bigint;
    validatorsRewards: bigint;
    delegatorsRewards: bigint;
    rewards: bigint;
    validatorsCount: number;
    delegatorsCount: number;
    switch: boolean;
    undelegatedThisBlock: bigint;
    stakedDiffThisBlock: bigint;
    stakedDiffSinceGenesis: bigint;
    stakedDiffSinceGenesisMotes: string;
    timestamp: string;
    [prop: string]: any;
    constructor(data?: Partial<Block>);
}
