import { Entity } from '@loopback/repository';
export declare class ValidatorsUnlockConstants extends Entity {
    id?: number;
    unlock90: string;
    unlock365: string;
    constructor(data?: Partial<ValidatorsUnlockConstants>);
}
export interface ValidatorsUnlockConstantsRelations {
}
export declare type ValidatorsUnlockConstantsWithRelations = ValidatorsUnlockConstants & ValidatorsUnlockConstantsRelations;
