import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MetricsDbDataSource} from '../datasources';
import {ValidatorsUnlockConstants, ValidatorsUnlockConstantsRelations} from '../models';

export class ValidatorsUnlockConstantsRepository extends DefaultCrudRepository<
  ValidatorsUnlockConstants,
  typeof ValidatorsUnlockConstants.prototype.id,
  ValidatorsUnlockConstantsRelations
> {
  constructor(
    @inject('datasources.metricsDB') dataSource: MetricsDbDataSource,
  ) {
    super(ValidatorsUnlockConstants, dataSource);
  }
}
