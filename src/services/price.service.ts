import { injectable, /* inject, */ BindingScope } from '@loopback/core';
import { Filter, repository } from '@loopback/repository';
import { EraRepository, PriceRepository } from '../repositories';
import moment from 'moment';
import dotenv from 'dotenv';
import axios from 'axios';
import { Era } from '../models';
import { logger } from '../logger';
dotenv.config();

@injectable( { scope: BindingScope.TRANSIENT } )
export class PriceService {

	private _requestsLimit = 2;

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
						gt: moment().add( -1, 'hours' ).format()
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
		const lastDate = await this._getLastStoredPriceDate();
		const toTs = lastDate.add( this._requestsLimit, 'hours' ).unix();

		logger.debug( 'here' )
		const result = await axios.get(
			'https://min-api.cryptocompare.com/data/v2/histohour?fsym=CSPR&tsym=USD' +
			'&limit=' + this._requestsLimit +
			'&toTs=' + toTs +
			'&api_key=' + process.env.CC_API_KEY
		);

		if ( result && result.status === 200 && result.data?.Data?.Data?.length ) {
			logger.debug( 'in the loop ')
			for ( const hour of result.data.Data.Data ) {
				const existingRecord = await this.priceRepository.find( {
					where: { date: moment( hour.time ).format() }
				} );

				if ( ! existingRecord.length ) {
					logger.debug( 'creating price ')
					await this.priceRepository.create( {
						date: moment( hour.time ).format(),
						price: hour.close,
						volume: hour.volumefrom
					} );
				}
			}
		}
	}

	private async _getLastStoredPriceDate(): Promise<moment.Moment> {
		const lastRecord = await this.priceRepository.find( {
			limit : 1,
			order: ['id DESC'],
		} );

		if ( lastRecord && lastRecord.length ) {
			return moment( lastRecord[0].date );
		}

		const firstEra = await this.eraRepository.findById( 0 );

		return moment( firstEra.start );
	}

}
