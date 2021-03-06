// This files contains typical error messages and status codes to be invoked from the app.
// It exports typical classes, extending the generic Error class.

export class NotFound extends Error {
	statusCode: number;

	constructor( message: string = 'Not found.' ) {
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

export class IncorrectData extends Error {
	statusCode: number;

	constructor( message: string ) {
		super( message );
		this.statusCode = 400;
	}
}

