import { authenticate, AuthenticationBindings } from '@loopback/authentication';
import { inject, service } from '@loopback/core';
import { repository } from '@loopback/repository';
import { get, getModelSchemaRef, oas, OperationVisibility, param, post, response } from '@loopback/rest';
import { UserProfile } from '@loopback/security';
import { NotAllowed, NotFound } from '../errors/errors';
import { AdminLogServiceBindings } from '../keys';
import { logger } from '../logger';
import { Transfer } from '../models';
import { BlockRepository, EraRepository, KnownAccountRepository, ProcessingRepository, TransferRepository } from '../repositories';
import { AdminLogService, CirculatingService } from '../services';

const { Graph } = require( 'dsa.js' );
const clone = require( 'node-clone-js' );

export class TransferController {
	constructor(
		@repository( TransferRepository )
		public transferRepository: TransferRepository,
		@repository( BlockRepository )
		public blockRepository: BlockRepository,
		@repository( EraRepository )
		public eraRepository: EraRepository,
		@repository( KnownAccountRepository )
		public knownAccountRepository: KnownAccountRepository,
		@service( CirculatingService )
		public circulatingService: CirculatingService,
		@repository( ProcessingRepository )
		public processingRepository: ProcessingRepository,
		@inject( AdminLogServiceBindings.ADMINLOG_SERVICE )
		public adminLogService: AdminLogService,
	) {
	}

	@oas.visibility( OperationVisibility.UNDOCUMENTED )
	@authenticate( { strategy: 'jwt' } )
	@get( '/transfers' )
	@response( 200, {
		description: 'Array of Transfer model instances',
		content: {
			'application/json': {
				schema: {
					type: 'array',
					items: getModelSchemaRef( Transfer, { includeRelations: false } ),
				},
			},
		},
	} )
	async find(
		@param.query.string( 'toHash' ) toHash?: string,
		@param.query.string( 'fromHash' ) fromHash?: string,
		@param.query.string( 'approved' ) approved?: string,
		@param.query.number( 'perPage' ) perPage?: number,
		@param.query.number( 'page' ) page?: number,
		@param.query.string( 'deployHash' ) deployHash?: string,
		@param.query.string( 'sort' ) sort = 'blockHeight DESC',
	): Promise<any> {
		let filter: any = {
			where: {
				and: [
					{ depth: { lt: 3 } },
					{ depth: { gt: 0 } },
				],
			},
		};

		if ( toHash ) {
			if ( toHash.indexOf( 'account-hash' ) === -1 ) {
				const knownAccount = await this.knownAccountRepository.findOne( {
					where: { hex: toHash },
				} );
				if ( knownAccount ) {
					toHash = knownAccount.hash;
				} else {
					logger.warn( 'Not found hash for %s', toHash );
					throw new NotFound( 'Not found account hash' );
				}
			}

			filter = {
				where: {
					and: [
						{
							or: [
								{ toHash: toHash },
								{ toHash: toHash.toLowerCase() },
							],
						},
					],
				},
			};
		}

		if ( fromHash ) {
			if ( fromHash.indexOf( 'account-hash' ) === -1 ) {
				const knownAccount = await this.knownAccountRepository.findOne( {
					where: { hex: fromHash },
				} );
				if ( knownAccount ) {
					fromHash = knownAccount.hash;
				} else {
					logger.warn( 'Not found hash for %s', toHash );
					throw new NotFound( 'Not found account hash' );
				}
			}

			filter = {
				where: {
					and: [
						{
							or: [
								{ fromHash: fromHash },
								{ fromHash: fromHash.toLowerCase() },
							],
						},
					],
				},
			};
		}
		if ( approved ) {
			filter = {
				where: {
					approved: true,
				},
			};
		}

		if ( deployHash ) {
			filter = {
				where: {
					and: [
						{
							or: [
								{ deployHash: deployHash },
								{ deployHash: deployHash.toLowerCase() },
							],
						},
					],
				},
			};
		}

		const allFilter = clone( filter );
		allFilter.fields = ['amount'];

		const approvedFilter = clone( filter );

		if ( approvedFilter.where.and ) {
			approvedFilter.where.and.push( {
				approved: true,
			} );
		} else {
			approvedFilter.where.approved = true;
		}

		if ( perPage && page ) {
			filter.limit = perPage;
			filter.skip = perPage * ( page - 1 );
		}

		filter.order = [sort];

		const data = await this.transferRepository.find( filter );

		const approvedItems = await this.transferRepository.find( approvedFilter );
		let approvedSum = approvedItems.reduce( ( a, b ) => {
			return a + BigInt( b.amount );
		}, BigInt( 0 ) );

		const allData = await this.transferRepository.find( allFilter );
		let totalSum = allData.reduce( ( a, b ) => {
			return a + BigInt( b.amount );
		}, BigInt( 0 ) );

		return {
			totalItems: await this.transferRepository.count( filter.where ),
			approvedSum: Number( approvedSum / BigInt( 1000000000 ) ),
			totalSum: Number( totalSum / BigInt( 1000000000 ) ),
			data: data,
		};
	}

	@oas.visibility( OperationVisibility.UNDOCUMENTED )
	@authenticate( { strategy: 'jwt' } )
	@get( '/transfers_tree' )
	@response( 200, {
		description: 'Array of Transfer model instances 3 levels far from genesis vaults',
		content: {
			'application/json': {
				schema: {
					type: 'array',
					items: getModelSchemaRef( Transfer, { includeRelations: false } ),
				},
			},
		},
	} )
	async findTree(): Promise<any> {
		const filter: any = {
			where: {
				and: [
					{ depth: { lt: 3 } },
					{ depth: { gt: 0 } },
				],
			},
		};

		const data = await this.transferRepository.find( filter );

		return {
			totalItems: data.length,
			data: data,
		};
	}

	@get( '/transfersByEraId' )
	@response( 200, {
		description: 'Transfers filtered by Era Id',
		content: {
			'application/json': {
				schema: {
					type: 'array',
					items: getModelSchemaRef( Transfer, { includeRelations: false } ),
				},
			},
		},
	} )
	async findByEraId(
		@param.query.number( 'eraId' ) eraId?: number,
		@param.query.number( 'limit' ) limit: number = 20,
	): Promise<any> {
		if ( eraId === undefined ) {
			const lastCompletedEraFilter = {
				limit: 1,
				order: ['id DESC'],
				skip: 1,
			};
			const era = await this.eraRepository.findOne( lastCompletedEraFilter );
			if ( era ) {
				eraId = era.id;
			} else {
				eraId = 0;
			}
		}
		const filter = {
			where: {
				eraId: eraId,
			},
		};

		let transfers = await this.transferRepository.find( filter );

		transfers.sort( ( a: any, b: any ) => {
			if ( parseInt( a.amount ) > parseInt( b.amount ) ) {
				return -1;
			}
			if ( parseInt( a.amount ) < parseInt( b.amount ) ) {
				return 1;
			} else {
				return 0;
			}
		} );

		let transfersCount = transfers.length;

		if ( transfersCount > limit ) {
			transfers = transfers.slice( 0, limit );
		}

		// Create duplicate nodes for a DAG diagram.
		if ( transfers.length ) {
			const graph: any = new Graph( Graph.DIRECTED );
			for ( const transfer of transfers ) {
				graph.addEdge( transfer.fromHash, transfer.toHash );
			}
			for ( const transfer of transfers ) {
				if ( graph.findPath( transfer.toHash, transfer.fromHash ).length > 0 ) {
					transfer.toHash = 'dub-' + transfer.toHash;
				}
			}
		}

		const era = await this.eraRepository.findById( eraId );

		return {
			eraId: eraId,
			eraStart: era.start,
			eraEnd: era.end,
			transfers: transfers,
			count: transfersCount,
		};
	}

	@oas.visibility( OperationVisibility.UNDOCUMENTED )
	@authenticate( { strategy: 'jwt', options: { required: ['editor', 'administrator'] } } )
	@post( '/transfers/calculate' )
	@response( 200, {
		description: 'Re-calculate circulating supply',
	} )
	async calculate(
		@inject( AuthenticationBindings.CURRENT_USER ) currentUser: UserProfile,
	): Promise<void> {
		if ( await this.status() ) {
			throw new NotAllowed( 'Deployment in progress. Please try later.' );
		}

		const approvedItems = await this.transferRepository.find( {
			where: { approved: true },
			fields: ['amount', 'deployHash'],
		} );

		let approvedSum = approvedItems.reduce( ( a, b ) => {
			return a + BigInt( b.amount );
		}, BigInt( 0 ) );

		approvedSum = BigInt( approvedSum ) / BigInt( 1000000000 );

		await this.adminLogService.write(
			currentUser,
			'Approved ' + approvedItems.length + ' TXs: ' + approvedSum + ' CSPR',
			approvedItems.map( tx => tx.deployHash + '|' + String( BigInt( tx.amount ) / BigInt( 1000000000 ) ) ).join( ';' ),
		);

		// Async. We don't wait for it to complete here.
		this.circulatingService.calculateCirculatingSupply();
	}

	@oas.visibility( OperationVisibility.UNDOCUMENTED )
	@authenticate( { strategy: 'jwt', options: { required: ['editor', 'administrator'] } } )
	@post( '/transfers/approve' )
	@response( 200, {
		description: 'Approve transactions as unlocked',
	} )
	async approve(
		@inject( AuthenticationBindings.CURRENT_USER ) currentUser: UserProfile,
		@param.query.string( 'approvedIds' ) approvedIds?: string,
		@param.query.string( 'declinedIds' ) declinedIds?: string,
	): Promise<void> {
		if ( await this.status() ) {
			throw new NotAllowed( 'Deployment in progress. Please try later.' );
		}
		if ( approvedIds ) {
			const approved: number[] = approvedIds.split( ',' ).map(
				id => Number( id ),
			);
			const txs = [];
			let sum = 0;
			for ( const id of approved ) {
				await this.transferRepository.updateById( id, {
					approved: true,
				} );

				const tx = await this.transferRepository.findById( id );
				txs.push( tx.deployHash + '|' + String( BigInt( tx.amount ) / BigInt( 1000000000 ) ) );
				sum += Number( BigInt( tx.amount ) / BigInt( 1000000000 ) );
			}

			await this.adminLogService.write(
				currentUser,
				'Saved ' + approved.length + ' TXs as approved: ' + sum + ' CSPR',
				txs.join( ';' ),
			);
		}

		if ( declinedIds ) {
			const declined: number[] = declinedIds.split( ',' ).map(
				id => Number( id ),
			);
			const txs = [];
			let sum = 0;
			for ( const id of declined ) {
				await this.transferRepository.updateById( id, {
					approved: false,
				} );

				const tx = await this.transferRepository.findById( id );
				txs.push( tx.deployHash + '|' + String( BigInt( tx.amount ) / BigInt( 1000000000 ) ) );
				sum -= Number( BigInt( tx.amount ) / BigInt( 1000000000 ) );
			}

			await this.adminLogService.write(
				currentUser,
				'Saved ' + declined.length + ' TXs as not approved: ' + sum + ' CSPR',
				txs.join( ';' ),
			);
		}
	}

	@oas.visibility( OperationVisibility.UNDOCUMENTED )
	@authenticate( { strategy: 'jwt', options: { required: ['editor', 'administrator'] } } )
	@get( '/transfers/status' )
	@response( 200, {
		description: 'Processing status',
	} )
	async status(): Promise<boolean> {
		const status = await this.processingRepository.findOne( {
			where: {
				type: 'updating',
			},
		} );

		if ( !status ) {
			return false;
		}
		return status.value;
	}
}
