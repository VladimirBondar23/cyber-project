import net from "node:net";
import { pool } from "../db";
import { Mode, RuleType } from "../types";

/* ---------- parsing / validation ---------- */
export function parseType(raw: string | undefined): RuleType | null {
  if (!raw) return null;
  const t = raw.toLowerCase();
  return t === "ip" || t === "url" || t === "port" ? (t as RuleType) : null;
}

const isValidIp = (v: string) => net.isIP(v) !== 0;
const isValidPort = (v: number | string) => {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isInteger(n) && n >= 0 && n <= 65535;
};
const isValidDomain = (v: string) =>
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(v);

export function normalizeValues(type: RuleType, values: (string | number)[]): string[] {
  return values.map(v => String(v).trim());
}

export function validateValues(type: RuleType, values: (string | number)[]) {
  const errors: string[] = [];
  for (const raw of values) {
    const v = String(raw).trim();
    if (type === "ip" && !isValidIp(v)) errors.push(`invalid ip: ${raw}`);
    if (type === "url" && !isValidDomain(v)) errors.push(`invalid domain: ${raw}`);
    if (type === "port" && !isValidPort(raw)) errors.push(`invalid port: ${raw}`);
  }
  return errors;
}

/* ---------- DB helpers ---------- */
export async function upsertRules(type: RuleType, mode: Mode, values: string[]) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO firewall_rules(type, mode, value)
       SELECT $1, $2, v FROM unnest($3::text[]) AS t(v)
       ON CONFLICT (type, mode, value) DO UPDATE SET active = TRUE`,
      [type, mode, [...new Set(values)]]
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function deleteRules(type: RuleType, mode: Mode, values: string[]) {
  await pool.query(
    `DELETE FROM firewall_rules
     WHERE type = $1 AND mode = $2 AND value = ANY($3::text[])`,
    [type, mode, values]
  );
}
