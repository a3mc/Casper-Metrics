import { repository } from '@loopback/repository';
import { get, getModelSchemaRef, response } from '@loopback/rest';
import { Price } from '../models';
import { PriceRepository } from '../repositories';
import CoinGecko from 'coingecko-api';
const CoinGeckoClient = new CoinGecko();

export class PriceController {
    constructor(
        @repository( PriceRepository )
        public priceRepository: PriceRepository,
    ) {
    }

    @get( '/prices' )
    @response( 200, {
        description: 'Last prices',
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
            limit: 14 * 24, // Two weeks by default
            order: ['id DESC']
        }
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
        const result = await CoinGeckoClient.simple.price( {
            ids: 'casper-network',
            vs_currencies: 'usd'
        } );

        return result?.data['casper-network']?.usd;
    }
}
