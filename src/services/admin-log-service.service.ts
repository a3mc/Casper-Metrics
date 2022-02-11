import { BindingScope, injectable } from '@loopback/core';
import { repository } from '@loopback/repository';
import { logger } from '../logger';
import { AdminLogRepository } from '../repositories';

@injectable( { scope: BindingScope.TRANSIENT } )
export class AdminLogService {
	constructor(
		@repository( AdminLogRepository )
		public adminLogRepository: AdminLogRepository,
	) {
	}

	public async write( action: string ): Promise<void> {
		logger.debug( action );
	}
}
