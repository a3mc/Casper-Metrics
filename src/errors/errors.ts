export class NotFound extends Error {
    statusCode: number;

    constructor( message: string = 'Not found.' ) {
        super( message );
        this.statusCode = 404;
    }
}
