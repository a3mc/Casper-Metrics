import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MetricsDbDataSource} from '../datasources';
import {Processing, ProcessingRelations} from '../models';

export class ProcessingRepository extends DefaultCrudRepository<
  Processing,
  typeof Processing.prototype.id,
  ProcessingRelations
> {
  constructor(
    @inject('datasources.metricsDB') dataSource: MetricsDbDataSource,
  ) {
    super(Processing, dataSource);
  }
}
