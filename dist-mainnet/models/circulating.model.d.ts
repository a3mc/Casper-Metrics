import { Entity } from '@loopback/repository';
export declare class Circulating extends Entity {
    id?: number;
    timestamp: string;
    blockHeight: number;
    eraId: number;
    unlock?: string;
    deployHash?: string;
    constructor(data?: Partial<Circulating>);
}
export interface CirculatingRelations {
}
export declare type CirculatingWithRelations = Circulating & CirculatingRelations;
