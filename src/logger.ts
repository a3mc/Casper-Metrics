const winston = require( 'winston' );
const { format } = require( 'winston' );
const { combine, timestamp, prettyPrint, splat } = format;
const TelegramLogger = require( 'winston-telegram' );
import dotenv from 'dotenv';
dotenv.config();

export const logger = winston.createLogger( {
    level: process.env.DEBUG_LEVEL ?? 'info',
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

if ( process.env.TG_TOKEN && process.env.TG_CHAT_ID ) {
    logger.add( new TelegramLogger( {
        level: 'error',
        token: process.env.TG_TOKEN,
        chatId: process.env.TG_CHAT_ID
    } ) );
}

logger.add( new winston.transports.Console( {
    format: combine(
        winston.format.colorize(),
        winston.format.simple(),
    )
} ) );
