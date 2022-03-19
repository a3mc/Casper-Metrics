import { BindingScope, injectable } from '@loopback/core';
import { Filter, repository } from '@loopback/repository';
import axios from 'axios';
import dotenv from 'dotenv';
import moment from 'moment';
import { logger } from '../logger';
import { Era } from '../models';
import { EraRepository, PriceRepository } from '../repositories';

dotenv.config();

@injectable( { scope: BindingScope.TRANSIENT } )
export class PriceService {

	private _requestsLimit = 2000;

	constructor(
		@repository( PriceRepository ) public priceRepository: PriceRepository,
		@repository( EraRepository ) public eraRepository: EraRepository,
	) {
	}

	public async checkForUpdate(): Promise<void> {
		if ( !process.env.CC_API_KEY ) return;

		let eraFilter: Filter<Era> = {
			limit: 1,
			order: ['id DESC'],
			skip: 1,
		};
		const lastCompletedEra = await this.eraRepository.find( eraFilter );

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

	private async _updatePrice(): Promise<void> {
		const lastDate: moment.Moment = await this._getLastStoredPriceDate();
		const toTs: number = lastDate.add( this._requestsLimit, 'hours' ).unix();

		const result = await axios.get(
			'https://min-api.cryptocompare.com/data/v2/histohour?fsym=CSPR&tsym=USD' +
			'&limit=' + this._requestsLimit +
			'&toTs=' + toTs +
			'&api_key=' + process.env.CC_API_KEY,
		).catch( () => {
			logger.warn( 'Error fetching price data. Failed to connect' );
		} );

		if ( result && result.status === 200 && result.data?.Data?.Data?.length ) {
			for ( const hour of result.data.Data.Data ) {
				const existingRecord = await this.priceRepository.find( {
					where: { date: moment( hour.time * 1000 ).format() },
				} );

				if ( !existingRecord.length ) {
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

	private async _getLastStoredPriceDate(): Promise<moment.Moment> {
		const lastRecord = await this.priceRepository.find( {
			limit: 1,
			order: ['id DESC'],
		} );

		if ( lastRecord && lastRecord.length ) {
			return moment( lastRecord[0].date );
		}

		const firstEra = await this.eraRepository.findById( 0 );
		return moment( firstEra.start );
	}

}
