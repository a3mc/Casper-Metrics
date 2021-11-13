import { Entity } from '@loopback/repository';
export declare class Transfer extends Entity {
    id?: number;
    timestamp: string;
    depth: number;
    approved: boolean;
    blockHeight: number;
    deployHash: string;
    from: string;
    fromHash: string;
    to?: string;
    toHash: string;
    amount: string;
    constructor(data?: Partial<Transfer>);
}
