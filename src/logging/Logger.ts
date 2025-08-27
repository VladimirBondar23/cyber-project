import winston from "winston";
import { config } from "../env";

const isDev = config.ENV === "dev";
const logLevel = isDev ? "debug" : "info";

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

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

// Singleton Logger
class LoggerSingleton {
  private static instance: winston.Logger;
  private constructor() {}
  public static getInstance(): winston.Logger {
    if (!LoggerSingleton.instance) {
      LoggerSingleton.instance = winston.createLogger({
        level: logLevel,
        format: logFormat,
        transports,
      });
      LoggerSingleton.instance.on("error", (err) => {
        console.error("Logger initialization error:", err);
      });
      // Overwrite console methods
      console.log = (...args) => LoggerSingleton.instance.info(formatArgs(args));
      console.info = (...args) => LoggerSingleton.instance.info(formatArgs(args));
      console.warn = (...args) => LoggerSingleton.instance.warn(formatArgs(args));
      console.error = (...args) => LoggerSingleton.instance.error(formatArgs(args));
      console.debug = (...args) => LoggerSingleton.instance.debug(formatArgs(args));
    }
    return LoggerSingleton.instance;
  }
}

export const logger = LoggerSingleton.getInstance();
