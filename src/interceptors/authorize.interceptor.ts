import { AuthenticationBindings, AuthenticationMetadata } from '@loopback/authentication';
import {
    Getter,
    globalInterceptor,
    inject,
    Interceptor,
    InvocationContext,
    InvocationResult,
    Provider,
    ValueOrPromise
}                                                         from '@loopback/context';
import { HttpErrors }                                     from '@loopback/rest';
import { MyUserProfile, RequiredPermissions }             from '../types';
import { intersection }                                   from 'lodash';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
@globalInterceptor( 'auth-intercept', { tags: { name: 'authorize' } } )
export class AuthorizeInterceptor implements Provider<Interceptor> {
    constructor(
        @inject( AuthenticationBindings.METADATA )
        public metadata: AuthenticationMetadata,
        // dependency inject
        @inject.getter( AuthenticationBindings.CURRENT_USER )
        public getCurrentUser: Getter<MyUserProfile>
    ) {}

    /**
     * This method is used by LoopBack context to produce an interceptor function
     * for the binding.
     *
     * @returns An interceptor function
     */
    value() {
        return this.intercept.bind( this );
    }

    /**
     * The logic to intercept an invocation
     * @param invocationCtx - Invocation context
     * @param next - A function to invoke next interceptor or the target method
     */
    async intercept(
        invocationCtx: InvocationContext,
        next: () => ValueOrPromise<InvocationResult>
    ) {
        // eslint-disable-next-line no-useless-catch
        try {
            // Add pre-invocation logic here

            console.log('Log from authorize global interceptor')
            console.log(this.metadata);

            // if you not provide options in your @authenticate decorator
            // //if ( !this.metadata ) {
            //     return next();
            // //}



            let metadataOptions;

            Object.entries( this.metadata ).forEach( item => {
                try {
                    metadataOptions = item[1].options;
                } catch ( e ) {
                    console.log('here')
                    console.log(e)
                    //console.error( e );
                }
            } );

            if ( !metadataOptions ) {
                return next();
            }

            const requriedPermissions = metadataOptions as RequiredPermissions;
            const user = await this.getCurrentUser();

            const results = intersection(
                [user.permissions],
                requriedPermissions.required
            ).length;

            if (
                requriedPermissions.required !== undefined &&
                results === 0
            ) {
                throw new HttpErrors.Forbidden( 'INVALID ACCESS' );
            }

            const result = await next();
            // Add post-invocation logic here
            return result;
        } catch ( err ) {
            // Add error handling logic here
            throw err;
        }
    }
}
