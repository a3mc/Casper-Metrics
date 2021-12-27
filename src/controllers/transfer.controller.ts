import { Count, CountSchema, repository, Where } from '@loopback/repository';
import { get, getModelSchemaRef, oas, OperationVisibility, param, post, response } from '@loopback/rest';
import { Transfer } from '../models';
import { BlockRepository, CirculatingRepository, EraRepository, TransferRepository } from '../repositories';
import { service } from '@loopback/core';
import { CirculatingService } from '../services';
import { authenticate } from '@loopback/authentication';

const { LinkedList, Queue, Stack, Graph } = require( 'dsa.js' );

const clone = require( 'node-clone-js' );

export class TransferController {
	constructor(
		@repository( TransferRepository )
		public transferRepository: TransferRepository,
		@repository( CirculatingRepository )
		public circulatingRepository: CirculatingRepository,
		@repository( BlockRepository )
		public blockRepository: BlockRepository,
		@repository( EraRepository )
		public eraRepository: EraRepository,
		@service( CirculatingService )
		public circulatingService: CirculatingService,
	) {
	}

	@get( '/transfers/count' )
	@response( 200, {
		description: 'Transfer model count',
		content: { 'application/json': { schema: CountSchema } },
	} )
	async count(
		@param.where( Transfer ) where?: Where<Transfer>,
	): Promise<Count> {
		return this.transferRepository.count( where );
	}

	@get( '/transfers' )
	@response( 200, {
		description: 'Array of Transfer model instances',
		content: {
			'application/json': {
				schema: {
					type: 'array',
					items: getModelSchemaRef( Transfer, { includeRelations: true } ),
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
		@param.query.number( 'eraId' ) eraId?: number,
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
			filter = {
				where: {
					toHash: toHash,
				},
			};
		}
		if ( fromHash ) {
			filter = {
				where: {
					fromHash: fromHash,
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
		if ( eraId ) {
			filter = {
				where: {
					eraId: eraId,
				},
			};
		}

		const allFilter = clone( filter );
		const approvedFilter = clone( filter );
		approvedFilter.where.approved = true;

		if ( perPage && page ) {
			filter.limit = perPage;
			filter.skip = perPage * ( page - 1 );
		}

		const data = await this.transferRepository.find( filter );

		const approvedItems = await this.transferRepository.find( approvedFilter );
		const approvedSum = approvedItems.reduce( ( a, b ) => {
			return a + BigInt( b.amount );
		}, BigInt( 0 ) );

		const allData = await this.transferRepository.find( allFilter );
		let totalSum = allData.reduce( ( a, b ) => {
			return a + BigInt( b.amount );
		}, BigInt( 0 ) );

		// for ( let trans of allData ) {
		//     const block = await this.blockRepository.findById( trans.blockHeight );
		//     trans.eraId = block.eraId;
		//     await this.transferRepository.save( trans );
		// }

		return {
			totalItems: await this.transferRepository.count( filter.where ),
			approvedSum: Number( approvedSum / BigInt( 1000000000 ) ),
			totalSum: Number( totalSum / BigInt( 1000000000 ) ),
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
	): Promise<any> {
		if ( !eraId ) {
			eraId = 1000; // Fixmelast Era Id
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

		if ( transfers.length > 20 ) {
			transfers = transfers.slice( 0, 20 );
		}

		if ( transfers.length ) {
			const graph = new Graph( Graph.DIRECTED );
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
		};
	}

	@oas.visibility( OperationVisibility.UNDOCUMENTED )
	@authenticate( 'jwt' )
	@post( '/transfers/approve' )
	@response( 200, {
		description: 'Approve transactions as unlocked',
	} )
	async approve(
		@param.query.string( 'approvedIds' ) approvedIds?: string,
		@param.query.string( 'declinedIds' ) declinedIds?: string,
	): Promise<void> {
		if ( approvedIds ) {
			const approved: number[] = approvedIds.split( ',' ).map(
				id => Number( id ),
			);
			for ( const id of approved ) {
				await this.transferRepository.updateById( id, {
					approved: true,
				} );
			}
		}
		if ( declinedIds ) {
			const declined: number[] = declinedIds.split( ',' ).map(
				id => Number( id ),
			);
			for ( const id of declined ) {
				await this.transferRepository.updateById( id, {
					approved: false,
				} );
			}
		}
		const approvedTransfers = await this.transferRepository.find( {
			where: {
				approved: true,
			},
			fields: ['timestamp', 'amount', 'deployHash', 'blockHeight'],
		} ).catch();

		await this.circulatingRepository.deleteAll( {
			deployHash: { neq: '' },
		} );

		if ( approvedTransfers ) {
			let circulating = [];
			for ( const transfer of approvedTransfers ) {
				const block = await this.blockRepository.findById( transfer.blockHeight, {
					fields: ['eraId'],
				} );
				circulating.push( {
					timestamp: transfer.timestamp,
					unlock: transfer.amount,
					deployHash: transfer.deployHash,
					blockHeight: transfer.blockHeight,
					eraId: block.eraId,
				} );
			}
			await this.circulatingRepository.createAll( circulating );
		}

		await this.circulatingService.calculateCirculatingSupply();
	}
}
