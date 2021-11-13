import { LifeCycleObserver } from '@loopback/core';
import { juggler } from '@loopback/repository';
export declare class MetricsDbDataSource extends juggler.DataSource implements LifeCycleObserver {
    static dataSourceName: string;
    static readonly defaultConfig: {
        name: string;
        connector: string;
        url: string;
        host: string | undefined;
        port: string | undefined;
        user: string | undefined;
        password: string | undefined;
        database: string;
        supportBigNumbers: boolean;
        connectTimeout: number;
        acquireTimeout: number;
        connectionLimit: number;
    };
    constructor(dsConfig?: object);
}
