import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MetricsDbDataSource} from '../datasources';
import {Balance, BalanceRelations} from '../models';

export class BalanceRepository extends DefaultCrudRepository<
  Balance,
  typeof Balance.prototype.id,
  BalanceRelations
> {
  constructor(
    @inject('datasources.metricsDB') dataSource: MetricsDbDataSource,
  ) {
    super(Balance, dataSource);
  }
}
