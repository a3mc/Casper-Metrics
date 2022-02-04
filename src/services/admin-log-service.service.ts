import { injectable, BindingScope } from '@loopback/core';
import { repository } from '@loopback/repository';
import { AdminLogRepository } from '../repositories';
import { logger } from '../logger';

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
