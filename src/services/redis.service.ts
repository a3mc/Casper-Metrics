import { BindingScope, injectable } from '@loopback/core';
import * as redis from 'redis';
import { promisify } from 'util';
import { RedisClient } from "redis";
import dotenv from 'dotenv';
dotenv.config();

export interface RedisClientSet {
    client: RedisClient;
    getAsync: any;
    setAsync: any;
    incrbyAsync: any;
    decrbyAsync: any;
    deleteAsync: any;
}


@injectable( { scope: BindingScope.TRANSIENT } )
export class RedisService {
    public client: RedisClientSet;
    public pub: RedisClientSet;
    public sub: RedisClientSet;

    constructor() {
        this.client = this._createClient();
        this.pub = this._createClient();
        this.sub = this._createClient();
    }

    private _createClient(): RedisClientSet {
        const client = redis.createClient( { db: process.env.REDIS_DB ?? 0 } );
        return {
            client: client,
            getAsync: promisify( client.get ).bind( client ),
            setAsync: promisify( client.set ).bind( client ),
            incrbyAsync: promisify( client.incrby ).bind( client ),
            decrbyAsync: promisify( client.decrby ).bind( client ),
            deleteAsync: promisify( client.del ).bind( client ),
        };
    }
}
