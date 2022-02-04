import { DefaultCrudRepository } from '@loopback/repository';
import { User, UserRelations }   from '../models';
import { MetricsDbDataSource }   from '../datasources';
import { inject }                from '@loopback/core';

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
