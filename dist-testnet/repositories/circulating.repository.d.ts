import { DefaultCrudRepository } from '@loopback/repository';
import { MetricsDbDataSource } from '../datasources';
import { Circulating, CirculatingRelations } from '../models';
export declare class CirculatingRepository extends DefaultCrudRepository<Circulating, typeof Circulating.prototype.id, CirculatingRelations> {
    constructor(dataSource: MetricsDbDataSource);
}
