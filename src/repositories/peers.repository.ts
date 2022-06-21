import { inject } from '@loopback/core';
import { DefaultCrudRepository, repository } from '@loopback/repository';
import { MetricsDbDataSource } from '../datasources';
import { Peers, PeersRelations } from '../models';
import getter = repository.getter;

export class PeersRepository extends DefaultCrudRepository<Peers,
	typeof Peers.prototype.id,
	PeersRelations> {
	constructor(
		@inject( 'datasources.metricsDB' ) dataSource: MetricsDbDataSource,
	) {
		super( Peers, dataSource );
	}
}
