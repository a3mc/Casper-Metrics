import { Filter, repository, } from '@loopback/repository';
import { get, getModelSchemaRef, param, response, } from '@loopback/rest';
import { Block, Era } from '../models';
import { BlockRepository, EraRepository } from '../repositories';
import { NotFound } from "../errors/errors";

export class BlockController {
    constructor(
        @repository( BlockRepository )
        public blocksRepository: BlockRepository,
        @repository( EraRepository )
        public eraRepository: EraRepository,
    ) {
    }

    @get( '/block' )
    @response( 200, {
        description: `Last block or a block specified by blockHeight.
        `,
        content: {
            'application/json': {
                schema: getModelSchemaRef( Block, { includeRelations: false } ),
            },
        },
    } )
    async find(
        @param.query.number( 'blockHeight' ) blockHeight?: number,
    ): Promise<Partial<Block>> {
        let filter: Filter<Block> = {
            limit: 1,
            order: ['blockHeight DESC'],
        };
        if( blockHeight !== undefined ) {
            filter.where = {
                blockHeight: blockHeight
            }
        }
        const block: Partial<Block> | null = await this.blocksRepository.findOne( filter );
        if( block ) {
            const circulatingSupply: bigint = await this._getLastCirculatingSupply( block );
            block.circulatingSupply = Number( circulatingSupply );
        } else {
            throw new NotFound();
        }

        // Remove temporarily unused properties.
        delete block.stakedDiffSinceGenesis;
        delete block.stakedDiffSinceGenesisMotes;
        delete block.stakedDiffThisBlock;

        return block;
    }

    @get( 'block/circulating' )
    @response( 200, {
        description: `Most recent Circulation Supply of the last completed Era when called without params.
        Can be queried by "blockHeight"`,
        content: {
            'application/json': {},
        },
    } )
    async circulating(
        @param.query.number( 'blockHeight' ) blockHeight?: number,
    ): Promise<string> {
        let filter: Filter<Era> = {
            limit: 1,
            order: ['blockHeight DESC']
        };
        if( blockHeight !== undefined ) {
            filter.where = {
                blockHeight: blockHeight
            }
        }
        const block: Block | null = await this.blocksRepository.findOne( filter );
        if( !block ) {
            throw new NotFound();
        }
        return ( await this._getLastCirculatingSupply( block ) ).toString();
    }

    @get( 'block/total' )
    @response( 200, {
        description: `Most recent Total Supply of the last completed Era when called without params.
        Can be queried by "blockHeight"`,
        content: {
            'application/json': {},
        },
    } )
    async total(
        @param.query.number( 'blockHeight' ) blockHeight?: number,
    ): Promise<string> {
        let filter: Filter<Block> = {
            limit: 1,
            order: ['blockHeight DESC']
        };
        if( blockHeight !== undefined ) {
            filter.where = {
                blockHeight: blockHeight
            }
        }
        const lastRecord = await this.blocksRepository.findOne( filter )
            .catch( error => {
            } );

        if( !lastRecord ) {
            throw new NotFound();
        }
        return lastRecord.totalSupply.toString();
    }

    private async _getLastCirculatingSupply( block: Partial<Block> ): Promise<bigint> {
        let circulatingSupply = BigInt( 0 );
        if( block && block.eraId ) {
            const blockEra = await this.eraRepository.findById( block.eraId );
            circulatingSupply = blockEra.circulatingSupply;
        }
        return circulatingSupply;
    }
}
