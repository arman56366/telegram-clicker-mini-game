"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
// Log format
const logFormat = winston_1.default.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});
// Create a logger
const logger = winston_1.default.createLogger({
    level: "info",
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), logFormat),
    transports: [
        // Log to the console
        new winston_1.default.transports.Console(),
        // Log rotation (daily)
        new winston_daily_rotate_file_1.default({
            filename: "logs/application-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true, // Archive old logs
            maxSize: "20m", // Maximum file size
            maxFiles: "14d", // Keep logs for 14 days
        }),
        // Error logs
        new winston_1.default.transports.File({ filename: "logs/error.log", level: "error" }),
    ],
});
exports.default = logger;
