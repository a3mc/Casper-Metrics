import { BindingScope, injectable } from '@loopback/core';
import { repository } from '@loopback/repository';
import { UserProfile } from '@loopback/security';
import moment from 'moment';
import { AdminLogRepository, UserRepository } from '../repositories';

@injectable( { scope: BindingScope.TRANSIENT } )
export class AdminLogService {

	constructor(
		@repository( AdminLogRepository )
		public adminLogRepository: AdminLogRepository,
		@repository( UserRepository )
		public userRepository: UserRepository,
	) {
	}

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
