import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';
import { MetricsDbDataSource } from '../datasources';
import { KnownAccount } from '../models';

export class KnownAccountRepository extends DefaultCrudRepository<KnownAccount,
    typeof KnownAccount.prototype.id> {
    constructor(
        @inject( 'datasources.metricsDB' ) dataSource: MetricsDbDataSource,
    ) {
        super( KnownAccount, dataSource );
    }
}
