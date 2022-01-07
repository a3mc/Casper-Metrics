import { injectable, /* inject, */ BindingScope } from '@loopback/core';
import { repository } from '@loopback/repository';
import { PeersRepository } from '../repositories';
import moment from 'moment';
import { logger } from '../logger';
import { promises as fs } from "fs";
import { geodata } from '../mocks/geodata.mock';

@injectable( { scope: BindingScope.TRANSIENT } )
export class GeodataService {
	constructor(
		@repository( PeersRepository ) public peersRepository: PeersRepository
	) {
	}

	public async checkForUpdate(): Promise<void> {
		const lastRecord = await this.peersRepository.find( {
			where: {
				added: {
					gt: moment().add( -1, 'hours' ).format()
				}
			}
		} );

		if ( !lastRecord.length ) {
			logger.debug( 'Need to update geodata peers info.' );
			await this.updateGeoData();
		}
	}

	private async updateGeoData(): Promise<void> {
		// If a mock of data is used for testing;
		const data: any = geodata;
		for ( const peer of data.result[0] ) {
			peer.added = moment().format();
		}
		await this.peersRepository.createAll( data.result[0] );
		logger.debug( 'Updated geodata with %d items', data.result[0].length )
	}
}
