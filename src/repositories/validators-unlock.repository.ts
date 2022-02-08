import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';
import { MetricsDbDataSource } from '../datasources';
import { ValidatorsUnlock } from '../models';

export class ValidatorsUnlockRepository extends DefaultCrudRepository<ValidatorsUnlock,
	typeof ValidatorsUnlock.prototype.id> {
	constructor(
		@inject( 'datasources.metricsDB' ) dataSource: MetricsDbDataSource,
	) {
		super( ValidatorsUnlock, dataSource );
	}
}
