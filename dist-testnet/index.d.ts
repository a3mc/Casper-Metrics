import { ApplicationConfig, CasperMetricsApplication } from './application';
import { ApplicationAdmin } from './application-admin';
export * from './application';
export * from './application-admin';
export declare function main(options?: ApplicationConfig): Promise<CasperMetricsApplication>;
export declare function admin(options?: ApplicationConfig): Promise<ApplicationAdmin>;
