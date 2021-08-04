import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MetricsDbDataSource} from '../datasources';
import {Circulating, CirculatingRelations} from '../models';

export class CirculatingRepository extends DefaultCrudRepository<
  Circulating,
  typeof Circulating.prototype.id,
  CirculatingRelations
> {
  constructor(
    @inject('datasources.metricsDB') dataSource: MetricsDbDataSource,
  ) {
    super(Circulating, dataSource);
  }
}
