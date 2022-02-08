import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';
import { MetricsDbDataSource } from '../datasources';
import { User } from '../models';

export type Credentials = {
	email: string;
	password?: string;
	role: string;
	firstName?: string;
	lastName?: string;
	faCode?: string;
}

export class UserRepository extends DefaultCrudRepository<User,
	typeof User.prototype.id> {
	constructor(
		@inject( 'datasources.metricsDB' ) dataSource: MetricsDbDataSource,
	) {
		super( User, dataSource );
	}
}
