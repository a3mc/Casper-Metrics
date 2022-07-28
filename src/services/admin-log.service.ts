import { BindingScope, injectable } from '@loopback/core';
import { repository } from '@loopback/repository';
import { UserProfile } from '@loopback/security';
import moment from 'moment';
import { AdminLogRepository, UserRepository } from '../repositories';

// Service to save actions that happen in admin panel to the database for history purpose.
@injectable( { scope: BindingScope.TRANSIENT } )
export class AdminLogService {

	// Depends on the user and log repositories.
	constructor(
		@repository( AdminLogRepository )
		public adminLogRepository: AdminLogRepository,
		@repository( UserRepository )
		public userRepository: UserRepository,
	) {
	}

	// Make a record to the database with the given values: who did what, when.
	public async write(
		currentUser: UserProfile,
		action: string,
		extra: string = '',
	): Promise<void> {
		const user = await this.userRepository.findById( currentUser.id );
		await this.adminLogRepository.create( {
			date: moment().format(),
			userId: user.id,
			userName: user.firstName + ' ' + user.lastName,
			userEmail: user.email,
			action: action,
			extra: extra,
		} );
	}
}
