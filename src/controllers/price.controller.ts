import { Filter, repository, } from '@loopback/repository';
import { get, getModelSchemaRef, param, response, } from '@loopback/rest';
import { Price } from '../models';
import { PriceRepository } from '../repositories';
import CoinGecko from 'coingecko-api';
import moment from 'moment/moment';
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
    async prices(): Promise<any> {
        // const filter = {
        //     limit: 100
        // }
        // return this.priceRepository.find( filter );
        // TODO: Cache!
        // const result = await CoinGeckoClient.coins.fetchHistory(
        //     'casper-network',
        //     {
        //         date: moment().add( -3, 'days' ).format( 'DD-MM-YYYY' ),
        //     }
        // );

        // TODO: using mock for now

        const prices = [];
        for ( let i = -13; i <= 0; i ++ ) {
            prices.push( {
                date: moment().add( i, 'days' ).format( 'YYYY-MM-DD' ),
                price: Math.random().toFixed( 4 ),
                volume: Math.round( Math.random() * 10000000 )
            } );
        }

        return prices;
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
        // TODO: Cache!
        const result = await CoinGeckoClient.simple.price( {
            ids: 'casper-network',
            vs_currencies: 'usd'
        } );

        return result?.data['casper-network']?.usd;
    }
}
