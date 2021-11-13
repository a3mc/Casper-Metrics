import { Block } from '../models';
import { BlockRepository, EraRepository } from '../repositories';
export declare class BlockController {
    blocksRepository: BlockRepository;
    eraRepository: EraRepository;
    constructor(blocksRepository: BlockRepository, eraRepository: EraRepository);
    find(blockHeight?: number): Promise<Partial<Block>>;
    circulating(blockHeight?: number): Promise<string>;
    total(blockHeight?: number): Promise<string>;
    private _getLastCirculatingSupply;
}
