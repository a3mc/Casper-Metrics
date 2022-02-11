import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';
import { MetricsDbDataSource } from '../datasources';
import { Era, EraRelations } from '../models';

export class EraRepository extends DefaultCrudRepository<Era,
	typeof Era.prototype.id,
	EraRelations> {
	constructor(
		@inject( 'datasources.metricsDB' ) dataSource: MetricsDbDataSource,
	) {
		super( Era, dataSource );
	}
}
