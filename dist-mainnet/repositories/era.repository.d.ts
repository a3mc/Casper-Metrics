import { DefaultCrudRepository } from '@loopback/repository';
import { MetricsDbDataSource } from '../datasources';
import { Era, EraRelations } from '../models';
export declare class EraRepository extends DefaultCrudRepository<Era, typeof Era.prototype.id, EraRelations> {
    constructor(dataSource: MetricsDbDataSource);
}
