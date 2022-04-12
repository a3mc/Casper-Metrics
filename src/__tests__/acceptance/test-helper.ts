import { Client, createRestAppClient, givenHttpServerConfig } from '@loopback/testlab';
import moment from 'moment';
import { CasperMetricsApplication } from '../..';
import { logger } from '../../logger';
import { Block, Era, Price, Transfer, User } from '../../models';
import { BlockRepository, EraRepository, PeersRepository, PriceRepository, TransferRepository, UserRepository } from '../../repositories';
import { testdb } from './metrics-db.datasource';

const twofactor = require( 'node-2fa' );

export async function setupApplication(): Promise<AppWithClient> {
	const restConfig = givenHttpServerConfig( {
		// Customize the server configuration here.
		// Empty values (undefined, '') will be ignored by the helper.
		//
		// host: process.env.HOST,
		// port: +process.env.PORT,
	} );

	const app = new CasperMetricsApplication( {
		rest: restConfig,
	} );

	await app.boot();
	app.dataSource( testdb );
	await app.start();

	const client = createRestAppClient( app );

	return { app, client };
}

export async function givenTestDatabase() {
	// Clean in-memory db and create mock data for tests.

	const blockRepository = new BlockRepository( testdb );
	await blockRepository.deleteAll();
	const blocks: Partial<Block>[] = [];
	for ( let i = 1; i < 10000; i++ ) {
		blocks.push(
			{
				blockHeight: i,
				eraId: Math.floor( i / 100 ),
				circulatingSupply: BigInt( 0 ),
				validatorsWeights: BigInt( 0 ),
				totalSupply: BigInt( 0 ),
				stateRootHash: 'a123',
				transfersCount: 0,
				deploysCount: 0,
				stakedThisBlock: BigInt( 0 ),
				undelegatedThisBlock: BigInt( 0 ),
				nextEraValidatorsWeights: BigInt( 0 ),
				validatorsRewards: BigInt( 0 ),
				delegatorsRewards: BigInt( 0 ),
				rewards: BigInt( 0 ),
				validatorsCount: 0,
				delegatorsCount: 0,
				switch: false,
				timestamp: moment().format(),
			},
		);
	}
	await blockRepository.createAll( blocks );

	const eraRepository = new EraRepository( testdb );
	await eraRepository.deleteAll();
	const eras: Partial<Era>[] = [];
	for ( let i = 1; i < 200; i++ ) {
		eras.push(
			{
				id: i,
				startBlock: ( i - 1 ) * 100,
				endBlock: i * 100,
				start: moment().format(),
				end: moment().format(),
				circulatingSupply: BigInt( 0 ),
				validatorsWeights: BigInt( 0 ),
				totalSupply: BigInt( 0 ),
				transfersCount: 0,
				deploysCount: 0,
				stakedThisEra: BigInt( 0 ),
				stakedDiffThisEra: BigInt( 0 ),
				undelegatedThisEra: BigInt( 0 ),
				validatorsRewards: BigInt( 0 ),
				delegatorsRewards: BigInt( 0 ),
				rewards: BigInt( 0 ),
				validatorsCount: 0,
				delegatorsCount: 0,
			},
		);
	}
	await eraRepository.createAll( eras );

	const priceRepository = new PriceRepository( testdb );
	await priceRepository.deleteAll();
	const prices: Partial<Price>[] = [];
	for ( let i = 0; i < 5000; i++ ) {
		prices.push(
			{
				open: 0.122,
				close: 0.1331,
				high: 0.133,
				low: 0.11,
				volumeFrom: 1000,
				volumeTo: 100000,
				date: moment().format(),
			}
		);
	}
	await priceRepository.createAll( prices );

	const userRepository = new UserRepository( testdb );
	await userRepository.deleteAll();
	await userRepository.createAll( [
		{
			email: 'admin@localhost',
			role: 'administrator',
			password: '$2a$10$FbULErPMuQgKQwTipPNWr.EJiBFT4nYqo7v3fZl.mgDPbtgkjuOfS',
			firstName: 'Admin',
			lastName: 'Admin',
			active: true,
			faSecret: twofactor.generateSecret(
				{
					name: 'Casper Metrics',
					account: 'admin@localhost',
				},
			).secret
		},
		{
			email: 'editor@localhost',
			role: 'editor',
			password: '$2a$10$FbULErPMuQgKQwTipPNWr.EJiBFT4nYqo7v3fZl.mgDPbtgkjuOfS',
			firstName: 'Editor',
			lastName: 'User',
			active: true,
			faSecret: twofactor.generateSecret(
				{
					name: 'Casper Metrics',
					account: 'editor@localhost',
				},
			).secret
		},
		{
			email: 'viewer@localhost',
			role: 'viewer',
			password: '$2a$10$FbULErPMuQgKQwTipPNWr.EJiBFT4nYqo7v3fZl.mgDPbtgkjuOfS',
			firstName: 'Viewer',
			lastName: 'User',
			active: true,
			faSecret: twofactor.generateSecret(
				{
					name: 'Casper Metrics',
					account: 'viewer@localhost',
				},
			).secret
		},
		{
			email: 'notactive@localhost',
			role: 'administrator',
			password: '$2a$10$FbULErPMuQgKQwTipPNWr.EJiBFT4nYqo7v3fZl.mgDPbtgkjuOfS',
			firstName: 'Not',
			lastName: 'Active',
			active: false,
			faSecret: twofactor.generateSecret(
				{
					name: 'Casper Metrics',
					account: 'notactive@localhost',
				},
			).secret
		},
		{
			email: 'deleted@localhost',
			role: 'administrator',
			password: '$2a$10$FbULErPMuQgKQwTipPNWr.EJiBFT4nYqo7v3fZl.mgDPbtgkjuOfS',
			firstName: 'Deleted',
			lastName: 'Permanently',
			deleted: true,
			faSecret: twofactor.generateSecret(
				{
					name: 'Casper Metrics',
					account: 'deleted@localhost',
				},
			).secret
		},

	] );

	const peersRepository = new PeersRepository( testdb );
	await peersRepository.deleteAll();
	await peersRepository.createAll( [
		{
			'version': 1,
			'ip': '107.191.52.181',
			'hostname': '107.191.52.181.vultr.com',
			'city': 'Tokyo',
			'region': 'Tokyo',
			'country': 'JP',
			'loc': '35.6218,139.7709',
			'org': 'AS20473 The Constant Company, LLC',
			'postal': '135-0091',
			'timezone': 'Asia/Tokyo',
			'catch_time': '2022-01-06T21:57:04.305Z',
			'api_version': '1.4.3',
			'mission': 'VALIDATOR',
			'public_key': '01c01DCfFe900955C384E8428B54c58C5016CDda0594BC8652168D6dF0De773431',
			'rpc': 'RPC_OPEN',
			'status': 'STATUS_AVAILABLE',
			'metrics': 'PROM_YES',
			'errors': 'no',
			'peer_ip': '107.191.52.181',
		},
		{
			'version': 1,
			'ip': '1.15.171.36',
			'city': 'Shenzhen',
			'region': 'Guangdong',
			'country': 'CN',
			'loc': '22.5455,114.0683',
			'org': 'AS45090 Shenzhen Tencent Computer Systems Company Limited',
			'timezone': 'Asia/Shanghai',
			'catch_time': '2022-01-06T22:00:30.764Z',
			'api_version': '1.4.3',
			'mission': 'VALIDATOR',
			'public_key': '017b9a85B657e0a8c2e01bf2d80b6B2E6f8d8B4Bc6d7C479f21e59dCEeA761710b',
			'rpc': 'RPC_OPEN',
			'status': 'STATUS_AVAILABLE',
			'metrics': 'PROM_YES',
			'errors': 'no',
			'peer_ip': '1.15.171.36',
		},
	] );

	const transferRepository = new TransferRepository( testdb );
	await transferRepository.deleteAll();
	const transfers: Partial<Transfer>[] = [];
	for ( let i = 1; i < 29; i++ ) {
		transfers.push(
			{
				eraId: 100,
				depth: 0,
				blockHeight: 10001,
				deployHash: 'deployhash',
				from: 'fromaddress',
				fromHash: 'fromHash',
				to: 'toaddress',
				toHash: 'toHash',
				amount: '1000000000',
				denomAmount: 1,
				timestamp: moment().format(),
			}
		);
	}
	await transferRepository.createAll( transfers );

	logger.debug( 'Done creating test database records' );
}

export interface AppWithClient {
	app: CasperMetricsApplication;
	client: Client;
}
