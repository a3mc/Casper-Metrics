export class NotFound extends Error {
    statusCode: number;

    constructor( message: string ) {
        super( message );
        this.statusCode = 404;
    }
}

export class LimitRateExceeded extends Error {
    statusCode: number;

    constructor( message: string ) {
        super( message );
        this.statusCode = 429;
    }
}

export class EmailTaken extends Error {
    statusCode: number;

    constructor( message: string ) {
        super( message );
        this.statusCode = 409;
    }
}

export class NotAllowed extends Error {
    statusCode: number;

    constructor( message: string ) {
        super( message );
        this.statusCode = 405;
    }
}
