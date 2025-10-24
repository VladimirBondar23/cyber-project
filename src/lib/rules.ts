import net from "node:net";
import { Mode, RuleType } from "../types";
import { db } from "../db/db";
import { firewallRules } from "../db/schema";
import { and, eq, inArray } from "drizzle-orm";

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

export function normalizeValues(_type: RuleType, values: (string | number)[]): string[] {
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

export async function upsertRules(type: RuleType, mode: Mode, values: string[]) {
  const uniq = Array.from(new Set(values));
  if (uniq.length === 0) return;

  await db
    .insert(firewallRules)
    .values(uniq.map(v => ({ type, mode, value: v })))
    .onConflictDoUpdate({
      target: [firewallRules.type, firewallRules.mode, firewallRules.value],
      set: { active: true }, 
    });
}

export async function deleteRules(type: RuleType, mode: Mode, values: string[]) {
  if (values.length === 0) return;

  await db
    .delete(firewallRules)
    .where(
      and(
        eq(firewallRules.type, type),
        eq(firewallRules.mode, mode),
        inArray(firewallRules.value, values)
      )
    );
}