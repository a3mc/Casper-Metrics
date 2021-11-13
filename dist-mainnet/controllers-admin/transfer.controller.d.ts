import { Count, Where } from '@loopback/repository';
import { Transfer } from '../models';
import { BlockRepository, CirculatingRepository, EraRepository, TransferRepository } from '../repositories';
import { CirculatingService } from "../services";
export declare class TransferController {
    transferRepository: TransferRepository;
    circulatingRepository: CirculatingRepository;
    blockRepository: BlockRepository;
    eraRepository: EraRepository;
    circulatingService: CirculatingService;
    constructor(transferRepository: TransferRepository, circulatingRepository: CirculatingRepository, blockRepository: BlockRepository, eraRepository: EraRepository, circulatingService: CirculatingService);
    count(where?: Where<Transfer>): Promise<Count>;
    find(toHash?: string, fromHash?: string, approved?: string, perPage?: number, page?: number): Promise<any>;
    approve(approvedIds?: string, declinedIds?: string): Promise<void>;
}
