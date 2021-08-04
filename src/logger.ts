const winston = require( 'winston' );
const { format } = require( 'winston' );
const { combine, timestamp, prettyPrint, splat } = format;
const TelegramLogger = require( 'winston-telegram' );

export const logger = winston.createLogger( {
    level: 'info',
    format: combine(
        timestamp(),
        splat(),
        winston.format.json(),
        prettyPrint(),
    ),
    transports: [
        new winston.transports.File( { filename: 'error.log', level: 'error' } ),
        new winston.transports.File( { filename: 'warning.log', level: 'warning' } ),
        new winston.transports.File( { filename: 'combined.log' } ),
    ],
} );

// logger.add( new TelegramLogger( {
//     level: 'error',
//     token: 'YOUR TOKEN',
//     chatId: 'CHAT ID'
// } ) );

if ( process.env.NODE_ENV !== 'production' ) {
    logger.add( new winston.transports.Console( {
        format: combine(
            winston.format.colorize(),
            winston.format.simple(),
        )
    } ) );
}
