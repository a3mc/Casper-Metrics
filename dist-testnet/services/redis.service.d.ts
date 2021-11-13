import { RedisClient } from "redis";
export interface RedisClientSet {
    client: RedisClient;
    getAsync: any;
    setAsync: any;
    incrbyAsync: any;
    decrbyAsync: any;
}
export declare class RedisService {
    client: RedisClientSet;
    pub: RedisClientSet;
    sub: RedisClientSet;
    constructor();
    private _createClient;
}
