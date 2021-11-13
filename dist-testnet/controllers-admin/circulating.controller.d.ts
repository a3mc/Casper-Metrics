import { Count, Filter, FilterExcludingWhere, Where } from '@loopback/repository';
import { Circulating } from '../models';
import { CirculatingRepository } from '../repositories';
export declare class CirculatingController {
    circulatingRepository: CirculatingRepository;
    constructor(circulatingRepository: CirculatingRepository);
    create(circulating: Omit<Circulating, 'id'>): Promise<Circulating>;
    count(where?: Where<Circulating>): Promise<Count>;
    find(filter?: Filter<Circulating>): Promise<Circulating[]>;
    updateAll(circulating: Circulating, where?: Where<Circulating>): Promise<Count>;
    findById(id: number, filter?: FilterExcludingWhere<Circulating>): Promise<Circulating>;
    updateById(id: number, circulating: Circulating): Promise<void>;
    replaceById(id: number, circulating: Circulating): Promise<void>;
    deleteById(id: number): Promise<void>;
}
