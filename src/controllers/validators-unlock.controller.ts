import { authenticate, AuthenticationBindings } from '@loopback/authentication';
import { inject, service } from '@loopback/core';
import { repository } from '@loopback/repository';
import { get, getModelSchemaRef, oas, OperationVisibility, param, post, response } from '@loopback/rest';
import { UserProfile } from '@loopback/security';
import moment from 'moment';
import { networks } from '../configs/networks';
import { NotAllowed } from '../errors/errors';
import { AdminLogServiceBindings } from '../keys';
import { ValidatorsUnlock } from '../models';
import { ProcessingRepository, ValidatorsUnlockConstantsRepository, ValidatorsUnlockRepository } from '../repositories';
import { AdminLogService, CirculatingService } from '../services';

@oas.visibility( OperationVisibility.UNDOCUMENTED )
export class ValidatorsUnlockController {
	constructor(
		@repository( ValidatorsUnlockRepository )
		public validatorsUnlockRepository: ValidatorsUnlockRepository,
		@repository( ValidatorsUnlockConstantsRepository )
		public validatorsUnlockConstantsRepository: ValidatorsUnlockConstantsRepository,
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
		@param.query.number( 'amount' ) amount: number,
	): Promise<void> {
		const status = await this.processingRepository.findOne( {
			where: { type: 'updating' },
		} );

		if ( status && status.value ) {
			throw new NotAllowed( 'Deployment in progress. Please try later.' );
		}

		await this.validatorsUnlockConstantsRepository.deleteAll();

		const unlock365 = BigInt( amount ) * BigInt( 1000000000 );
		const unlock90 = BigInt( networks.genesis_validators_weights_total ) * BigInt( 1000000000 ) - unlock365;

		await this.validatorsUnlockConstantsRepository.create( {
			unlock90: unlock90.toString(),
			unlock365: unlock365.toString(),
		} );
		await this.calculateValidatorsUnlocks( currentUser );
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
		return this.validatorsUnlockConstantsRepository.find();
	}

	async calculateValidatorsUnlocks( currentUser: UserProfile ): Promise<void> {
		let validatorsUnlockConstants = await this.validatorsUnlockConstantsRepository.findOne();
		await this.validatorsUnlockRepository.deleteAll();

		if ( !validatorsUnlockConstants ) {
			validatorsUnlockConstants = await this.validatorsUnlockConstantsRepository.create( {
				unlock90: '0',
				unlock365: '0',
			} );
		}
		for ( let day = 0; day < 14; day++ ) {
			await this.validatorsUnlockRepository.create( {
				amount: ( ( BigInt( validatorsUnlockConstants.unlock90 ) / BigInt( 14 ) ) ).toString(),
				day: 90 + day,
				timestamp: moment( networks.genesis_timestamp ).add( 90 + day, 'days' ).toISOString(),
			} );
		}
		await this.validatorsUnlockRepository.create( {
			amount: ( BigInt( validatorsUnlockConstants.unlock365 ) ).toString(),
			day: 365,
			timestamp: moment( networks.genesis_timestamp ).add( 365, 'days' ).toISOString(),
		} );

		await this.adminLogService.write(
			currentUser,
			'Approved Validators Unlocks with ' +
			( BigInt( validatorsUnlockConstants.unlock365 ) / BigInt( 1000000000 ) ) +
			' CSPR to be unlocked in 1 year',
			''
		);

		// Async. We don't wait for it to finish here.
		this.circulatingService.calculateCirculatingSupply();
	}
}
