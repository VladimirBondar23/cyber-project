import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "../env";
import * as schema from "./schema";


// Create postgres-js client
export const client = postgres(config.DATABASE_URI, {
  onnotice: () => {}, 
});

// Create Drizzle ORM client (typed via schema)
export const db = drizzle(client, { schema });

export async function initDb(): Promise<void> {
  let connected = false;
  while (!connected) {
    try {
      await client`SELECT 1`;
      await client`
        CREATE TABLE IF NOT EXISTS firewall_rules (
          id BIGSERIAL PRIMARY KEY,
          type TEXT NOT NULL CHECK (type IN ('ip','url','port')),
          mode TEXT NOT NULL CHECK (mode IN ('blacklist','whitelist')),
          value TEXT NOT NULL,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          UNIQUE (type, mode, value)
        );
      `;
      connected = true;
      console.log("Database connection established.");
    } catch (err) {
      console.error(
        "Database connection failed, retrying in",
        config.DB_CONNECTION_INTERVAL,
        "ms"
      );
      await new Promise((res) => setTimeout(res, config.DB_CONNECTION_INTERVAL));
    }
  }
}
