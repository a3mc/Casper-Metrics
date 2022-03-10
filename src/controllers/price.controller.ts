import { repository } from '@loopback/repository';
import { get, getModelSchemaRef, response } from '@loopback/rest';
import axios from 'axios';
import CoinGecko from 'coingecko-api';
import { logger } from '../logger';
import { Price } from '../models';
import { PriceRepository } from '../repositories';

const CoinGeckoClient = new CoinGecko();

export class PriceController {
	constructor(
		@repository( PriceRepository )
		public priceRepository: PriceRepository,
	) {
	}

	@get( '/prices' )
	@response( 200, {
		description: 'Prices in a given range or the whole history when called without params.',
		content: {
			'application/json': {
				schema: {
					type: 'array',
					items: getModelSchemaRef( Price, { includeRelations: false } ),
				},
			},
		},
	} )
	async prices(): Promise<Price[]> {
		const filter = {
			skip: 3402, // Beginning of market data available
			limit: 24 * 365 * 5, // Up to 5 years
		};
		return this.priceRepository.find( filter );
	}

	@get( '/price' )
	@response( 200, {
		description: 'Last price in USDT (Coingecko)',
		content: {
			'application/json': {
				schema: {
					type: 'number',
				},
			},
		},
	} )
	async last(): Promise<Number> {
		logger.debug( 'Call to Coingecko ');
		const result = await CoinGeckoClient.simple.price( {
			ids: 'casper-network',
			vs_currencies: 'usd',
		} ).catch(
			() => {
				logger.warn( 'Error from Coingecko' );
			}
		);

		if ( !result || !result.data['casper-network'] || !result.data['casper-network'].usd ) {
			return 0;
		}

		return result?.data['casper-network']?.usd;
	}
}
