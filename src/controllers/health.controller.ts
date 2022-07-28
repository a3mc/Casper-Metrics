import { repository } from '@loopback/repository';
import { get, oas, OperationVisibility, response } from '@loopback/rest';
import { PeersRepository } from '../repositories';

// REST API controller class for pinging health status, served by the Loopback framework.
export class HealthController {
	constructor(
		@repository( PeersRepository )
		public peersRepository: PeersRepository,
	) {
	}

	// Check the status, if REST API is alive.
	@get( '/health' )
	@response( 200 )
	async health(): Promise<string> {
		return 'I\'m fine!';
	}

	// No practical use on that, just to fill the empty page if user accidentally gets to the root of the API.
	@oas.visibility( OperationVisibility.UNDOCUMENTED )
	@get( '/' )
	@response( 200 )
	async welcome(): Promise<string> {
		return 'Welcome!';
	}
}
