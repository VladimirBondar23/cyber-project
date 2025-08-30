import { Router, Request, Response } from "express";
import { db } from "../db/db";
import { firewallRules } from "../db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  parseType,
  normalizeValues,
  validateValues,
  upsertRules,
  deleteRules,
} from "../lib/rules";
import { Mode, RuleType } from "../types";





export async function get_rules(req: Request, res: Response) {
  const rows = await db
    .select({
      id: firewallRules.id,
      type: firewallRules.type,
      mode: firewallRules.mode,
      value: firewallRules.value,
    })
    .from(firewallRules)
    .where(eq(firewallRules.active, true))
    .orderBy(asc(firewallRules.id));

  const out = {
    ips: { blacklist: [] as any[], whitelist: [] as any[] },
    urls: { blacklist: [] as any[], whitelist: [] as any[] },
    ports: { blacklist: [] as any[], whitelist: [] as any[] },
  };

  for (const r of rows) {
    const item = {
      id: r.id!,
      value: isNaN(Number(r.value)) ? r.value : Number(r.value),
    };
    const mode = r.mode as "blacklist" | "whitelist";
    if (r.type === "ip") out.ips[mode].push(item);
    if (r.type === "url") out.urls[mode].push(item);
    if (r.type === "port") out.ports[mode].push(item);
  }

  res.json(out);
}


export async function patch_rules(req: Request, res: Response) {
  type Section = { ids?: number[]; mode?: Mode; active?: boolean };
  const sections: Partial<Record<"ips" | "urls" | "ports", Section>> = req.body ?? {};

  const updates: Array<{ type: RuleType; ids: number[]; mode: Mode; active: boolean }> = [];
  for (const [key, sec] of Object.entries(sections)) {
    if (!sec || !Array.isArray(sec.ids) || sec.ids.length === 0) continue;
    if (typeof sec.active !== "boolean" || !sec.mode) {
      return res.status(400).json({ error: `section ${key} must include ids[], mode, active` });
    }
    const t = key.slice(0, -1) as RuleType; // "ips" -> "ip"
    updates.push({ type: t, ids: sec.ids, mode: sec.mode, active: sec.active });
  }
  if (updates.length === 0) return res.json({ updated: [] });

  const updatedItems: Array<{ id: number; value: string; active: boolean }> = [];

  await db.transaction(async (tx) => {
    for (const u of updates) {
      const rows = await tx
        .update(firewallRules)
        .set({ active: u.active })
        .where(
          and(
            eq(firewallRules.type, u.type),
            eq(firewallRules.mode, u.mode),
            inArray(firewallRules.id, u.ids)
          )
        )
        .returning({
          id: firewallRules.id,
          value: firewallRules.value,
          active: firewallRules.active,
        });
      updatedItems.push(...rows);
    }
  });

  res.json({ updated: updatedItems });
}