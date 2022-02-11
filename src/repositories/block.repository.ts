import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';
import { MetricsDbDataSource } from '../datasources';
import { Block } from '../models';

export class BlockRepository extends DefaultCrudRepository<Block,
	typeof Block.prototype.id> {
	constructor(
		@inject( 'datasources.metricsDB' ) dataSource: MetricsDbDataSource,
	) {
		super( Block, dataSource );
	}
}
