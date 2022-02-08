import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';
import { MetricsDbDataSource } from '../datasources';
import { Price, PriceRelations } from '../models';

export class PriceRepository extends DefaultCrudRepository<Price,
	typeof Price.prototype.id,
	PriceRelations> {
	constructor(
		@inject( 'datasources.metricsDB' ) dataSource: MetricsDbDataSource,
	) {
		super( Price, dataSource );
	}
}
