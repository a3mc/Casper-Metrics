import { BindingScope, injectable } from '@loopback/core';
import dotenv from 'dotenv';
import * as redis from 'redis';
import { RedisClient } from 'redis';
import { promisify } from 'util';

dotenv.config();

// This comtains a Redis client and a few methods wrapped for async usage.
export interface RedisClientSet {
	client: RedisClient;
	getAsync: any;
	setAsync: any;
	incrbyAsync: any;
	decrbyAsync: any;
	deleteAsync: any;
}

// A helper service for using Redis.
// It wraps a few needed methods in Promises and creates connected clients.
@injectable( { scope: BindingScope.TRANSIENT } )
export class RedisService {
	public client: RedisClientSet;
	public pub: RedisClientSet;
	public sub: RedisClientSet;

	// Requires nothing to be passed for initialising.
	constructor() {
		this.client = this._createClient();
		this.pub = this._createClient();
		this.sub = this._createClient();
	}

	private _createClient(): RedisClientSet {
		// We assume DB:0 can be a default, otherwise it can be set in the environment variables.
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
