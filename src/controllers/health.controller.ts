import { repository } from '@loopback/repository';
import { get, getModelSchemaRef, response } from '@loopback/rest';
import { Peers } from '../models';
import { PeersRepository } from '../repositories';

export class HealthController {
	constructor(
		@repository( PeersRepository )
		public peersRepository: PeersRepository,
	) {
	}

	@get( '/health' )
	@response( 200 )
	async health(): Promise<string> {
		return 'Ok';
	}
