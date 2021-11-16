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
import {
    AuthenticateFn,
    AUTHENTICATION_STRATEGY_NOT_FOUND,
    AuthenticationBindings,
    USER_PROFILE_NOT_FOUND
} from '@loopback/authentication';

export class MyAdminSequence implements SequenceHandler {

    constructor(
        @inject(AuthenticationBindings.AUTH_ACTION)
        protected authenticateRequest: AuthenticateFn,
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
            response.header('Access-Control-Allow-Origin', '*');
            response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

            if (request.method == 'OPTIONS') {
                response.status(200)
                this.send(response, 'ok');
            } else {
                const route = this.findRoute( request );
                await this.authenticateRequest(request);
                const args = await this.parseParams( request, route );
                const result = await this.invoke( route, args );
                this.send( response, result );
            }
        } catch ( err ) {
            if (
                err.code === AUTHENTICATION_STRATEGY_NOT_FOUND ||
                err.code === USER_PROFILE_NOT_FOUND
            ) {
                Object.assign(err, {statusCode: 401 /* Unauthorized */});
            }
            // ---------- END OF SNIPPET -------------
            this.reject(context, err);
        }
    }
}


