import { repository } from '@loopback/repository';
import { get, oas, OperationVisibility, response } from '@loopback/rest';
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
		return 'I\'m fine!';
	}

	@oas.visibility( OperationVisibility.UNDOCUMENTED )
	@get( '/' )
	@response( 200 )
	async welcome(): Promise<string> {
		return 'Welcome!';
	}
}
