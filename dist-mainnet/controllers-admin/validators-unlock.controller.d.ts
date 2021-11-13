import { ValidatorsUnlockConstantsRepository, ValidatorsUnlockRepository } from '../repositories';
import { CirculatingService } from "../services";
export declare class ValidatorsUnlockController {
    validatorsUnlockRepository: ValidatorsUnlockRepository;
    validatorsUnlockConstantsRepository: ValidatorsUnlockConstantsRepository;
    circulatingService: CirculatingService;
    constructor(validatorsUnlockRepository: ValidatorsUnlockRepository, validatorsUnlockConstantsRepository: ValidatorsUnlockConstantsRepository, circulatingService: CirculatingService);
    create(amount: number): Promise<void>;
    findAll(): Promise<any[]>;
    calculateValidatorsUnlocks(): Promise<void>;
}
