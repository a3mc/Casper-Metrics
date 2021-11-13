import { DefaultCrudRepository } from '@loopback/repository';
import { MetricsDbDataSource } from '../datasources';
import { KnownAccount } from '../models';
export declare class KnownAccountRepository extends DefaultCrudRepository<KnownAccount, typeof KnownAccount.prototype.id> {
    constructor(dataSource: MetricsDbDataSource);
}
