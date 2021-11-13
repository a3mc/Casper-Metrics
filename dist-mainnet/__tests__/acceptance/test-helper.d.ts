import { CasperMetricsApplication } from '../..';
import { Client } from '@loopback/testlab';
export declare function setupApplication(): Promise<AppWithClient>;
export interface AppWithClient {
    app: CasperMetricsApplication;
    client: Client;
}
