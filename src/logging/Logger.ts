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

function formatArgs(args: any[]) {
  return args
    .map(a =>
      typeof a === "object" && a !== null
        ? JSON.stringify(a, null, 2)
        : String(a)
    )
    .join(" ");
}


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
console.log = (...args) => logger.info(formatArgs(args));
console.info = (...args) => logger.info(formatArgs(args));
console.warn = (...args) => logger.warn(formatArgs(args));
console.error = (...args) => logger.error(formatArgs(args));
console.debug = (...args) => logger.debug(formatArgs(args));
