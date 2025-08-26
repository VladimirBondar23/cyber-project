import { z } from "zod";
import "dotenv/config";
// Define schema for environment variables
const envSchema = z.object({
  ENV: z.enum(["dev", "production"]),
  PORT: z.string().transform(Number).refine(p => p > 0 && p < 65536, { message: "PORT must be a valid port number (1-65535)" }),
  DATABASE_URI_DEV: z.string().url({ message: "DATABASE_URI_DEV must be a valid URL" }),
  DATABASE_URI_PRODUCTION: z.string().url({ message: "DATABASE_URI_PRODUCTION must be a valid URL" }),
});

// Parse and validate environment variables
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Environment validation error:", parsed.error.format());
  process.exit(1);
}

const { ENV, PORT, DATABASE_URI_DEV, DATABASE_URI_PRODUCTION } = parsed.data;

// Select the correct database URI based on ENV
const DATABASE_URI = ENV === "dev" ? DATABASE_URI_DEV : DATABASE_URI_PRODUCTION;

// Example constant strings used across the program
export const TABLE_FIREWALL = "firewall_rules";

// Export config object
export const config = {
  ENV,
  PORT,
  DATABASE_URI,
  TABLE_FIREWALL,
};