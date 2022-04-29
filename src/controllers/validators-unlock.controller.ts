import { authenticate, AuthenticationBindings } from '@loopback/authentication';
import { inject, service } from '@loopback/core';
import { repository } from '@loopback/repository';
import { get, getModelSchemaRef, oas, OperationVisibility, post, requestBody, response } from '@loopback/rest';
import { UserProfile } from '@loopback/security';
import moment from 'moment';
import { networks } from '../configs/networks';
import { IncorrectData, NotAllowed } from '../errors/errors';
import { AdminLogServiceBindings } from '../keys';
import { ValidatorsUnlock } from '../models';
import { ProcessingRepository, ValidatorsUnlockRepository } from '../repositories';
import { AdminLogService, CirculatingService } from '../services';

@oas.visibility( OperationVisibility.UNDOCUMENTED )
export class ValidatorsUnlockController {
	constructor(
		@repository( ValidatorsUnlockRepository )
		public validatorsUnlockRepository: ValidatorsUnlockRepository,
		@service( CirculatingService )
		public circulatingService: CirculatingService,
		@inject( AdminLogServiceBindings.ADMINLOG_SERVICE )
		public adminLogService: AdminLogService,
		@repository( ProcessingRepository )
		public processingRepository: ProcessingRepository,
	) {
	}

	@authenticate( { strategy: 'jwt', options: { required: ['editor', 'administrator'] } } )
	@post( '/validators-unlock' )
	@response( 200, {
		description: 'ValidatorsUnlock model instance',
		content: { 'application/json': { schema: getModelSchemaRef( ValidatorsUnlock ) } },
	} )
	async create(
		@inject( AuthenticationBindings.CURRENT_USER ) currentUser: UserProfile,
		@requestBody() unlocksData: any,
	): Promise<void> {
		const status = await this.processingRepository.findOne( {
			where: { type: 'updating' },
		} );

		if ( status && status.value ) {
			throw new NotAllowed( 'Calculation in progress. Please try later.' );
		}

		if ( !unlocksData || unlocksData.unlock90 === undefined || !unlocksData.custom ) {
			throw new IncorrectData( 'Data is invalid' );
		}

		await this.validatorsUnlockRepository.deleteAll();

		for ( let day = 0; day < 14; day++ ) {
			await this.validatorsUnlockRepository.create( {
				amount: (
					( BigInt( unlocksData.unlock90 ) * BigInt( 1000000000 ) ) / BigInt( 14 )
				).toString(),
				day: 90 + day,
				timestamp: moment( networks.genesis_timestamp ).add( 90 + day, 'days' ).toISOString(),
			} );
		}

		for ( const custom of unlocksData.custom ) {
			await this.validatorsUnlockRepository.create( {
				amount: ( BigInt( custom.amount ) * BigInt( 1000000000 ) ).toString(),
				day: moment( custom.date ).diff( networks.genesis_timestamp, 'days' ),
				timestamp: moment( custom.date ).toISOString(),
			} );
		}
	}

	@authenticate( { strategy: 'jwt' } )
	@get( '/validators-unlock' )
	@response( 200, {
		description: 'Array of ValidatorsUnlock model instances',
		content: {
			'application/json': {
				schema: {
					type: 'array',
					items: getModelSchemaRef( ValidatorsUnlock, { includeRelations: false } ),
				},
			},
		},
	} )
	async findAll(): Promise<any[]> {
		return this.validatorsUnlockRepository.find();
	}

	async calculateValidatorsUnlocks( currentUser: UserProfile ): Promise<void> {
		await this.adminLogService.write(
			currentUser,
			'Updated and approved Validators Unlocks schedule',
			'',
		);

		// Async. We don't wait for it to finish here.
		this.circulatingService.calculateCirculatingSupply();
	}
}
