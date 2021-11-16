import { Count, CountSchema, Filter, FilterExcludingWhere, repository, Where, } from '@loopback/repository';
import { del, get, getModelSchemaRef, param, patch, post, put, requestBody, response, } from '@loopback/rest';
import { Circulating } from '../models';
import { CirculatingRepository } from '../repositories';
import { authenticate } from '@loopback/authentication';

@authenticate('jwt')
export class CirculatingController {
    constructor(
        @repository( CirculatingRepository )
        public circulatingRepository: CirculatingRepository,
    ) {
    }
    
    @post( '/circulating' )
    @response( 200, {
        description: 'Circulating model instance',
        content: { 'application/json': { schema: getModelSchemaRef( Circulating ) } },
    } )
    async create(
        @requestBody( {
            content: {
                'application/json': {
                    schema: getModelSchemaRef( Circulating, {
                        title: 'NewCirculating',
                        exclude: ['id'],
                    } ),
                },
            },
        } )
            circulating: Omit<Circulating, 'id'>,
    ): Promise<Circulating> {
        return this.circulatingRepository.create( circulating );
    }

    
    @get( '/circulating/count' )
    @response( 200, {
        description: 'Circulating model count',
        content: { 'application/json': { schema: CountSchema } },
    } )
    async count(
        @param.where( Circulating ) where?: Where<Circulating>,
    ): Promise<Count> {
        return this.circulatingRepository.count( where );
    }

    
    @get( '/circulating' )
    @response( 200, {
        description: 'Array of Circulating model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef( Circulating, { includeRelations: true } ),
                },
            },
        },
    } )
    async find(
        @param.filter( Circulating ) filter?: Filter<Circulating>,
    ): Promise<Circulating[]> {
        return this.circulatingRepository.find( filter );
    }

    
    @patch( '/circulating' )
    @response( 200, {
        description: 'Circulating PATCH success count',
        content: { 'application/json': { schema: CountSchema } },
    } )
    async updateAll(
        @requestBody( {
            content: {
                'application/json': {
                    schema: getModelSchemaRef( Circulating, { partial: true } ),
                },
            },
        } )
            circulating: Circulating,
        @param.where( Circulating ) where?: Where<Circulating>,
    ): Promise<Count> {
        return this.circulatingRepository.updateAll( circulating, where );
    }

    
    @get( '/circulating/{id}' )
    @response( 200, {
        description: 'Circulating model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef( Circulating, { includeRelations: true } ),
            },
        },
    } )
    async findById(
        @param.path.number( 'id' ) id: number,
        @param.filter( Circulating, { exclude: 'where' } ) filter?: FilterExcludingWhere<Circulating>
    ): Promise<Circulating> {
        return this.circulatingRepository.findById( id, filter );
    }

    
    @patch( '/circulating/{id}' )
    @response( 204, {
        description: 'Circulating PATCH success',
    } )
    async updateById(
        @param.path.number( 'id' ) id: number,
        @requestBody( {
            content: {
                'application/json': {
                    schema: getModelSchemaRef( Circulating, { partial: true } ),
                },
            },
        } )
            circulating: Circulating,
    ): Promise<void> {
        await this.circulatingRepository.updateById( id, circulating );
    }

    
    @put( '/circulating/{id}' )
    @response( 204, {
        description: 'Circulating PUT success',
    } )
    async replaceById(
        @param.path.number( 'id' ) id: number,
        @requestBody() circulating: Circulating,
    ): Promise<void> {
        await this.circulatingRepository.replaceById( id, circulating );
    }

    
    @del( '/circulating/{id}' )
    @response( 204, {
        description: 'Circulating DELETE success',
    } )
    async deleteById( @param.path.number( 'id' ) id: number ): Promise<void> {
        await this.circulatingRepository.deleteById( id );
    }
}
