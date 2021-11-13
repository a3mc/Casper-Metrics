import { Entity } from '@loopback/repository';
export declare class KnownAccount extends Entity {
    id?: number;
    hash: string;
    hex?: string;
    name?: string;
    comment?: string;
    constructor(data?: Partial<KnownAccount>);
}
