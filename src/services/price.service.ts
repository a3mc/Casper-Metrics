import { BindingScope, injectable } from '@loopback/core';
import { Filter, repository } from '@loopback/repository';
import axios from 'axios';
import dotenv from 'dotenv';
import moment from 'moment';
import { logger } from '../logger';
import { Era } from '../models';
import { EraRepository, PriceRepository } from '../repositories';

dotenv.config();

// A service for fetching market data from an external service.
@injectable( { scope: BindingScope.TRANSIENT } )
export class PriceService {

	// It was found that it's safe to keep it at 2k, to prevent possible rate limiting.
	private _requestsLimit = 2000;

	// Requires access to price and era repositories to store and operate the data.
	constructor(
		@repository( PriceRepository ) public priceRepository: PriceRepository,
		@repository( EraRepository ) public eraRepository: EraRepository,
	) {
	}

	// It requires an Crypro-Compare API kee to work correctly.
	// It needs to be set in the .env file. App will work without it, but won't show the historical market data.
	public async checkForUpdate(): Promise<void> {
		if ( !process.env.CC_API_KEY ) return;

		let eraFilter: Filter<Era> = {
			limit: 1,
			order: ['id DESC'],
			skip: 1,
		};
		const lastCompletedEra = await this.eraRepository.find( eraFilter );

		// Don't abuse external service too often. We see what was locally cached first.
		// The granularity of the stored data is 1 hour.
		if ( lastCompletedEra && lastCompletedEra.length ) {
			const eraPrices = await this.priceRepository.find( {
				where: {
					date: {
						gt: moment().add( -1, 'hours' ).format(),
					},
				},
			} );

			if ( !eraPrices.length ) {
				logger.debug( 'Need to update price' );
				await this._updatePrice();
			}
		}
	}

	// Get the batch of data.
	private async _updatePrice(): Promise<void> {
		const lastDate: moment.Moment = await this._getLastStoredPriceDate();
		const toTs: number = lastDate.add( this._requestsLimit, 'hours' ).unix();

		// A cancel token is used with timeout to avoid a well-know problem with axious when it may hang on network errors.
		const source = axios.CancelToken.source();
		const timeout = setTimeout(() => {
			source.cancel();
		}, 60000 );

		const result = await axios.get(
			'https://min-api.cryptocompare.com/data/v2/histohour?fsym=CSPR&tsym=USD' +
			'&limit=' + this._requestsLimit +
			'&toTs=' + toTs +
			'&api_key=' + process.env.CC_API_KEY, {
				timeout: 60000
			}
		).catch( () => {
			// If we had a problem, we can get it on the next main loop check.
			logger.warn( 'Error fetching price data. Failed to connect' );
		} );
		// We can clear the "safe" timeout once we get some result.
		clearTimeout( timeout );

		// Check if the returned data is in the expected format and valid.
		if ( result && result.status === 200 && result.data?.Data?.Data?.length ) {
			// We save market data for each hour in the batch.
			for ( const hour of result.data.Data.Data ) {
				// Only save the values to the Price repository if we don't have them already there.
				const existingRecord = await this.priceRepository.find( {
					where: { date: moment( hour.time * 1000 ).format() },
				} );

				if ( !existingRecord.length ) {
					// Save a record.
					await this.priceRepository.create( {
						date: moment( hour.time * 1000 ).format(),
						low: hour.low,
						high: hour.high,
						open: hour.open,
						close: hour.close,
						volumeFrom: hour.volumefrom,
						volumeTo: hour.volumeto,
					} );
				}
			}
		}
	}

	// Find out the last saved market data we have.
	private async _getLastStoredPriceDate(): Promise<moment.Moment> {
		const lastRecord = await this.priceRepository.find( {
			limit: 1,
			order: ['id DESC'],
		} );

		if ( lastRecord && lastRecord.length ) {
			return moment( lastRecord[0].date );
		}

		// If we don't have any market data, we start from genesis.
		const firstEra = await this.eraRepository.findById( 0 );
		return moment( firstEra.start );
	}

}
