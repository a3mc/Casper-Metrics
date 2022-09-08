import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MetricsDbDataSource} from '../datasources';
import {Delegators, DelegatorsRelations} from '../models';

export class DelegatorsRepository extends DefaultCrudRepository<
  Delegators,
  typeof Delegators.prototype.id,
  DelegatorsRelations
> {
  constructor(
    @inject('datasources.metricsDB') dataSource: MetricsDbDataSource,
  ) {
    super(Delegators, dataSource);
  }
}
