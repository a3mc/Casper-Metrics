import { DefaultCrudRepository } from '@loopback/repository';
import { MetricsDbDataSource } from '../datasources';
import { Block } from '../models';
export declare class BlockRepository extends DefaultCrudRepository<Block, typeof Block.prototype.id> {
    constructor(dataSource: MetricsDbDataSource);
}
