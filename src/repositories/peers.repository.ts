import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MetricsDbDataSource} from '../datasources';
import {Peers, PeersRelations} from '../models';

export class PeersRepository extends DefaultCrudRepository<
  Peers,
  typeof Peers.prototype.id,
  PeersRelations
> {
  constructor(
    @inject('datasources.metricsDB') dataSource: MetricsDbDataSource,
  ) {
    super(Peers, dataSource);
  }
}
