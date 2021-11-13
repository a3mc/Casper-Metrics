import { BlockRepository, CirculatingRepository, EraRepository, TransferRepository, ValidatorsUnlockRepository } from "../repositories";
import { Era } from "../models";
export declare class CirculatingService {
    eraRepository: EraRepository;
    blocksRepository: BlockRepository;
    transferRepository: TransferRepository;
    validatorsUnlockRepository: ValidatorsUnlockRepository;
    circulatingRepository: CirculatingRepository;
    constructor(eraRepository: EraRepository, blocksRepository: BlockRepository, transferRepository: TransferRepository, validatorsUnlockRepository: ValidatorsUnlockRepository, circulatingRepository: CirculatingRepository);
    calculateCirculatingSupply(): Promise<void>;
    updateEraCirculatingSupply(era: Era): Promise<void>;
}
