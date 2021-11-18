import { DefaultCrudRepository } from '@loopback/repository';
import { User, UserRelations }   from '../models';
import { MetricsDbDataSource }   from '../datasources';
import { inject }                from '@loopback/core';

export type Credentials = {
  email: string;
  password: string;
  role: string;
}

export class UserRepository extends DefaultCrudRepository<User,
    typeof User.prototype.id,
    UserRelations> {
    constructor(
        @inject( 'datasources.metricsDB' ) dataSource: MetricsDbDataSource,
    ) {
        super( User, dataSource );
    }
}
