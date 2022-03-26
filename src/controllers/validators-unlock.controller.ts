import { authenticate } from '@loopback/authentication';
import { service } from '@loopback/core';
import { repository } from '@loopback/repository';
import { get, getModelSchemaRef, oas, OperationVisibility, param, post, response } from '@loopback/rest';
import moment from 'moment';
import { networks } from '../configs/networks';
import { ValidatorsUnlock } from '../models';
import { ValidatorsUnlockConstantsRepository, ValidatorsUnlockRepository } from '../repositories';
import { CirculatingService } from '../services';

@oas.visibility( OperationVisibility.UNDOCUMENTED )
export class ValidatorsUnlockController {
	constructor(
		@repository( ValidatorsUnlockRepository )
		public validatorsUnlockRepository: ValidatorsUnlockRepository,
		@repository( ValidatorsUnlockConstantsRepository )
		public validatorsUnlockConstantsRepository: ValidatorsUnlockConstantsRepository,
		@service( CirculatingService )
		public circulatingService: CirculatingService,
	) {
	}

	@authenticate( { strategy: 'jwt', options: { required: ['editor', 'administrator'] } } )
	@post( '/validators-unlock' )
	@response( 200, {
		description: 'ValidatorsUnlock model instance',
		content: { 'application/json': { schema: getModelSchemaRef( ValidatorsUnlock ) } },
	} )
	async create(
		@param.query.number( 'amount' ) amount: number,
	): Promise<void> {
		await this.validatorsUnlockConstantsRepository.deleteAll();

		const unlock365 = BigInt( amount ) * BigInt( 1000000000 );
		const unlock90 = BigInt( networks.genesis_validators_weights_total ) * BigInt( 1000000000 ) - unlock365;

		await this.validatorsUnlockConstantsRepository.create( {
			unlock90: unlock90.toString(),
			unlock365: unlock365.toString(),
		} );
		await this.calculateValidatorsUnlocks();
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
		let validatorsUnlocks = await this.validatorsUnlockConstantsRepository.find();

		if ( !validatorsUnlocks.length ) {
			await this.calculateValidatorsUnlocks();
			validatorsUnlocks = await this.validatorsUnlockConstantsRepository.find();
		}

		return validatorsUnlocks;
	}

	async calculateValidatorsUnlocks(): Promise<void> {
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

		// Async. We don't wait for it to finish here.
		this.circulatingService.calculateCirculatingSupply();
	}
}
