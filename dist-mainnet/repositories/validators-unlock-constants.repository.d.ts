import { DefaultCrudRepository } from '@loopback/repository';
import { MetricsDbDataSource } from '../datasources';
import { ValidatorsUnlockConstants, ValidatorsUnlockConstantsRelations } from '../models';
export declare class ValidatorsUnlockConstantsRepository extends DefaultCrudRepository<ValidatorsUnlockConstants, typeof ValidatorsUnlockConstants.prototype.id, ValidatorsUnlockConstantsRelations> {
    constructor(dataSource: MetricsDbDataSource);
}
