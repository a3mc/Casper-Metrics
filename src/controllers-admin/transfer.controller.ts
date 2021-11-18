import { Count, CountSchema, repository, Where, } from '@loopback/repository';
import { get, getModelSchemaRef, param, post, response, } from '@loopback/rest';
import { Transfer } from '../models';
import { BlockRepository, CirculatingRepository, EraRepository, TransferRepository } from '../repositories';
import { service } from "@loopback/core";
import { CirculatingService } from "../services";
import { authenticate } from '@loopback/authentication';

const clone = require( 'node-clone-js' )

@authenticate('jwt')
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
        public circulatingService: CirculatingService
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
    ): Promise<any> {
        let filter: any = {
            where: {
                and: [
                    { depth: { lt: 3 } },
                    { depth: { gt: 0 } },
                ]
            }
        }
        if ( toHash ) {
            filter = {
                where: {
                    toHash: toHash
                }
            };
        }
        if ( fromHash ) {
            filter = {
                where: {
                    fromHash: fromHash
                }
            };
        }
        if ( approved ) {
            filter = {
                where: {
                    approved: true
                }
            };
        }

        const allFilter = clone( filter );
        const approvedFilter = clone( filter );
        approvedFilter.where.approved = true;

        if ( perPage && page ) {
            filter.limit = perPage;
            filter.skip = perPage * ( page - 1 )
        }

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
            data: data
        };
    }

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
                id => Number( id )
            );
            for ( const id of approved ) {
                await this.transferRepository.updateById( id, {
                    approved: true
                } );
            }
        }
        if ( declinedIds ) {
            const declined: number[] = declinedIds.split( ',' ).map(
                id => Number( id )
            );
            for ( const id of declined ) {
                await this.transferRepository.updateById( id, {
                    approved: false
                } );
            }
        }
        const approvedTransfers = await this.transferRepository.find( {
            where: {
                approved: true,
            },
            fields: ['timestamp', 'amount', 'deployHash', 'blockHeight']
        } ).catch();

        await this.circulatingRepository.deleteAll( {
            deployHash: { neq: '' }
        } );

        if ( approvedTransfers ) {
            let circulating = [];
            for ( const transfer of approvedTransfers ) {
                const block = await this.blockRepository.findById( transfer.blockHeight, {
                    fields: ['eraId']
                } );
                circulating.push( {
                    timestamp: transfer.timestamp,
                    unlock: transfer.amount,
                    deployHash: transfer.deployHash,
                    blockHeight: transfer.blockHeight,
                    eraId: block.eraId
                } );
            }
            await this.circulatingRepository.createAll( circulating );
        }

        await this.circulatingService.calculateCirculatingSupply();
    }
}
