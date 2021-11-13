import { DefaultCrudRepository } from '@loopback/repository';
import { MetricsDbDataSource } from '../datasources';
import { Transfer } from '../models';
export declare class TransferRepository extends DefaultCrudRepository<Transfer, typeof Transfer.prototype.id> {
    constructor(dataSource: MetricsDbDataSource);
}
