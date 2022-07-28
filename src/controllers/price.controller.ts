import { repository } from '@loopback/repository';
import { get, getModelSchemaRef, oas, OperationVisibility, response } from '@loopback/rest';
import CoinGecko from 'coingecko-api';
import { logger } from '../logger';
import { Price } from '../models';
import { PriceRepository } from '../repositories';

const CoinGeckoClient = new CoinGecko();

// REST API controller class for operations with Market data, served by the Loopback framework.
export class PriceController {
	constructor(
		@repository( PriceRepository )
		public priceRepository: PriceRepository,
	) {
	}

	// Returns stored prices in the whole possible range. Undocumented as there's no need in wide public use.
	@oas.visibility( OperationVisibility.UNDOCUMENTED )
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
			skip: 3402, // Beginning of the available market data
			limit: 24 * 365 * 3, // Up to 3 years in one batch
		};
		return this.priceRepository.find( filter );
	}

	// Cached in Nginx server to prevent too frequent requests.
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
