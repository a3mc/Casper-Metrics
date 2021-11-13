import { Era } from '../models';
import { EraRepository } from '../repositories';
export declare class EraController {
    eraRepository: EraRepository;
    constructor(eraRepository: EraRepository);
    circulating(id?: number): Promise<string>;
    total(id?: number): Promise<string>;
    find(id?: number, blockHeight?: number, timestamp?: string, limit?: number, order?: string[]): Promise<Era[]>;
    private _calcSupplyQueryFilter;
}
