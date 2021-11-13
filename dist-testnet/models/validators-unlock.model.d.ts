import { Entity } from '@loopback/repository';
export declare class ValidatorsUnlock extends Entity {
    id?: number;
    day: number;
    timestamp: string;
    amount: string;
    constructor(data?: Partial<ValidatorsUnlock>);
}
