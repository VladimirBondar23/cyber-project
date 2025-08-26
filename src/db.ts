import { config } from "./env";
          
import { Pool } from 'pg';
export const pool = new Pool({
  connectionString: config.DATABASE_URI,
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS firewall_rules (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('ip','url','port')),
    mode TEXT NOT NULL CHECK (mode IN ('blacklist','whitelist')),
    value TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (type, mode, value)
);
`);
}
