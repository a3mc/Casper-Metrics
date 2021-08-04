import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';
import { MetricsDbDataSource } from '../datasources';
import { Transfer } from '../models';

export class TransferRepository extends DefaultCrudRepository<Transfer,
    typeof Transfer.prototype.id> {
    constructor(
        @inject( 'datasources.metricsDB' ) dataSource: MetricsDbDataSource,
    ) {
        super( Transfer, dataSource );
    }
}
