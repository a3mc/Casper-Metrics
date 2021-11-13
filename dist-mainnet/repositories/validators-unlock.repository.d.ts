import { DefaultCrudRepository } from '@loopback/repository';
import { MetricsDbDataSource } from '../datasources';
import { ValidatorsUnlock } from '../models';
export declare class ValidatorsUnlockRepository extends DefaultCrudRepository<ValidatorsUnlock, typeof ValidatorsUnlock.prototype.id> {
    constructor(dataSource: MetricsDbDataSource);
}
