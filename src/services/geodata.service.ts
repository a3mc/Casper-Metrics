import { BindingScope, injectable } from '@loopback/core';
import { repository } from '@loopback/repository';
import axios from 'axios';
import dotenv from 'dotenv';
import moment from 'moment';
import { logger } from '../logger';
import { geodata } from '../mocks/geodata.mock';
import { PeersRepository } from '../repositories';

dotenv.config();


// This service brings a table of peers, including Validators from an external service.
// If path to the service is not set in the .env, it uses a mock with the latest dump.
@injectable( { scope: BindingScope.TRANSIENT } )
export class GeodataService {
	constructor(
		@repository( PeersRepository ) public peersRepository: PeersRepository,
	) {
	}

	public async checkForUpdate(): Promise<void> {
		const lastRecord = await this.peersRepository.find( {
			where: {
				added: {
					gt: moment().add( 4, 'hours' ).format(),
				},
			},
			limit: 1,
		} );

		if ( !lastRecord.length ) {
			logger.debug( 'Need to check validators info for an update.' );
			await this.updateGeoData();
		}
	}

	private async updateGeoData(): Promise<void> {
		// If a mock of data is used for testing update just once.
		if ( !process.env.GEODATA ) {
			logger.debug( 'GEODATA path not set, using mock' );
			const existingRecords = await this.peersRepository.findOne();
			if ( !existingRecords ) {
				await this._update( geodata );
			}
		} else {
			logger.debug( 'Updating from geodata url' );
			const source = axios.CancelToken.source();
			const timeout = setTimeout(() => {
				source.cancel();
			}, 60000);

			const result = await axios.get(
				process.env.GEODATA, {
					timeout: 60000,
					cancelToken: source.token
				}
			).catch( () => {
				logger.warn( 'Error fetching validators data. Failed to connect' );
			} );
			clearTimeout( timeout );

			if ( result && result.status === 200 ) {
				const data = result.data;
				const existingRecords = await this.peersRepository.find( {
					where: { version: data.version },
					limit: 1,
				} );
				if ( !existingRecords.length ) {
					await this._update( data );
				}
			} else {
				logger.warn( 'Can\'t reach geodata endpoint.' );
			}

		}
	}

	private async _update( data: any ): Promise<void> {
		for ( const peer of data.result ) {
			peer.added = moment().format();
			peer.version = parseInt( data.version );
		}
		await this.peersRepository.createAll( data.result );
		logger.debug( 'Updated geodata with %d items to version %d', data.result.length, data.version );
	}
}
