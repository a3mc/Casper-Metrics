"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const tslib_1 = require("tslib");
const winston = require('winston');
const { format } = require('winston');
const { combine, timestamp, prettyPrint, splat } = format;
const TelegramLogger = require('winston-telegram');
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
dotenv_1.default.config();
exports.logger = winston.createLogger({
    level: 'info',
    format: combine(timestamp(), splat(), winston.format.json(), prettyPrint()),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'warning.log', level: 'warning' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});
if (process.env.TG_TOKEN && process.env.TG_CHAT_ID) {
    exports.logger.add(new TelegramLogger({
        level: 'error',
        token: process.env.TG_TOKEN,
        chatId: process.env.TG_CHAT_ID
    }));
}
if (process.env.NODE_ENV !== 'production') {
    exports.logger.add(new winston.transports.Console({
        format: combine(winston.format.colorize(), winston.format.simple())
    }));
}
//# sourceMappingURL=logger.js.map