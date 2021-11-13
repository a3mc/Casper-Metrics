import { Count, Filter, FilterExcludingWhere, Where } from '@loopback/repository';
import { KnownAccount } from '../models';
import { KnownAccountRepository } from '../repositories';
export declare class KnownAccountController {
    knownAccountsRepository: KnownAccountRepository;
    constructor(knownAccountsRepository: KnownAccountRepository);
    create(knownAccounts: Omit<KnownAccount, 'id'>): Promise<KnownAccount>;
    count(where?: Where<KnownAccount>): Promise<Count>;
    find(filter?: Filter<KnownAccount>): Promise<KnownAccount[]>;
    updateAll(knownAccounts: KnownAccount, where?: Where<KnownAccount>): Promise<Count>;
    findById(id: number, filter?: FilterExcludingWhere<KnownAccount>): Promise<KnownAccount>;
    updateById(id: number, knownAccounts: KnownAccount): Promise<void>;
    replaceById(id: number, knownAccounts: KnownAccount): Promise<void>;
    deleteById(id: number): Promise<void>;
}
