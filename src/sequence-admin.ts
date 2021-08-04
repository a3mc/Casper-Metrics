import {
    FindRoute,
    InvokeMethod,
    ParseParams,
    Reject,
    RequestContext,
    Send,
    SequenceActions,
    SequenceHandler
} from '@loopback/rest';
import { inject } from "@loopback/core";

export class MyAdminSequence implements SequenceHandler {

    constructor(
        @inject( SequenceActions.FIND_ROUTE ) protected findRoute: FindRoute,
        @inject( SequenceActions.PARSE_PARAMS ) protected parseParams: ParseParams,
        @inject( SequenceActions.INVOKE_METHOD ) protected invoke: InvokeMethod,
        @inject( SequenceActions.SEND ) public send: Send,
        @inject( SequenceActions.REJECT ) public reject: Reject,
    ) {
    }

    async handle( context: RequestContext ) {
        try {
            // First we try to find a matching route in the api
            const { request, response } = context;
            const route = this.findRoute( request );
            const args = await this.parseParams( request, route );
            const result = await this.invoke( route, args );
            this.send( response, result );
        } catch ( err ) {
            if ( err.statusCode === 404 ) {
                context.response.sendFile( 'dist-admin/index.html', { root: './' } )
            } else {
                this.reject( context, err );
            }
        }
    }
}


