// This file configures Winston to be used a main logger service.
// It can use multiple transports, for example to post errors to a Telegram services.
// It also automatically adds timestamps for all logs and stores it in JSON format.

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
		// Logs are stored in separate files, as well as in a combined one.
		// It's advice to have a log-rotate system to prevent from the to grow huge.
		new winston.transports.File( { filename: 'error.log', level: 'error' } ),
		new winston.transports.File( { filename: 'warning.log', level: 'warning' } ),
		new winston.transports.File( { filename: 'combined.log' } ),
	],
} );

// Only if configured in .env, it can send logs with "error" level directly to Telegram, so admins can take immediate action.
if ( process.env.TG_TOKEN && process.env.TG_CHAT_ID ) {
	logger.add( new TelegramLogger( {
		level: 'error',
		token: process.env.TG_TOKEN,
		chatId: process.env.TG_CHAT_ID,
	} ) );
}

// Options for simple printing to the console.
logger.add( new winston.transports.Console( {
	format: combine(
		winston.format.colorize(),
		winston.format.simple(),
	),
} ) );
