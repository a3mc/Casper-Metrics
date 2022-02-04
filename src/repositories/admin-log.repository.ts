import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';
import { MetricsDbDataSource } from '../datasources';
import { AdminLog, AdminLogRelations } from '../models';

export class AdminLogRepository extends DefaultCrudRepository<AdminLog,
	typeof AdminLog.prototype.id,
	AdminLogRelations> {
	constructor(
		@inject( 'datasources.metricsDB' ) dataSource: MetricsDbDataSource,
	) {
		super( AdminLog, dataSource );
	}
}
