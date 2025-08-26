import winston from "winston";
import { config } from "../env";

// Detect environment and set logging level
const isDev = config.ENV === "dev";
const logLevel = isDev ? "debug" : "info";

// Define log format for debugging and long-term readability
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// Set up transports based on environment
const transports = isDev
  ? [new winston.transports.Console()]
  : [
      new winston.transports.File({
        filename: "app.log",
        level: logLevel,
      }),
    ];

// Create the logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports,
});

// Graceful error handling for logger initialization
logger.on("error", (err) => {
  // Fallback to console if logger fails
  console.error("Logger initialization error:", err);
});

// Overwrite standard console.log, console.error, etc.
console.log = (...args) => logger.info(args.map(String).join(" "));
console.info = (...args) => logger.info(args.map(String).join(" "));
console.warn = (...args) => logger.warn(args.map(String).join(" "));
console.error = (...args) => logger.error(args.map(String).join(" "));
console.debug = (...args) => logger.debug(args.map(String).join(" "));
