import { Router, Request, Response } from "express";
import { pool } from "../db";
import {
  parseType,
  normalizeValues,
  validateValues,
  upsertRules,
  deleteRules
} from "../lib/rules";
import { Mode, RuleType } from "../types";

const router = Router();




router.post("/:type", async (req: Request, res: Response) => {
  const type = parseType(req.params.type);
  if (!type) return res.status(400).json({ error: "type must be ip|url|port" });

  const { values, mode } = req.body as { values?: (string | number)[]; mode?: Mode };
  if (!Array.isArray(values) || !mode) {
    return res.status(400).json({ error: "values[] and mode are required" });
  }

  const errs = validateValues(type, values);
  if (errs.length) return res.status(400).json({ error: "validation_error", details: errs });

  const normalized = normalizeValues(type, values);
  await upsertRules(type, mode, normalized);
  return res.json({ type, mode, values, status: "success" });
});




router.delete("/:type", async (req: Request, res: Response) => {
  const type = parseType(req.params.type);
  if (!type) return res.status(400).json({ error: "type must be ip|url|port" });

  const { values, mode } = req.body as { values?: (string | number)[]; mode?: Mode };
  if (!Array.isArray(values) || !mode) {
    return res.status(400).json({ error: "values[] and mode are required" });
  }

  const errs = validateValues(type, values);
  if (errs.length) return res.status(400).json({ error: "validation_error", details: errs });

  const normalized = normalizeValues(type, values);
  await deleteRules(type, mode, normalized);
  return res.json({ type, mode, values, status: "success" });
});



router.get("/rules", async (_req: Request, res: Response) => {
  const { rows } = await pool.query(
    `SELECT id, type, mode, value FROM firewall_rules WHERE active = TRUE ORDER BY id`
  );

  const out = {
    ips: { blacklist: [] as any[], whitelist: [] as any[] },
    urls: { blacklist: [] as any[], whitelist: [] as any[] },
    ports: { blacklist: [] as any[], whitelist: [] as any[] },
  };

  for (const r of rows) {
  const item = { id: r.id, value: isNaN(Number(r.value)) ? r.value : Number(r.value) };
  const mode = r.mode as "blacklist" | "whitelist";
  if (r.type === "ip")  out.ips[mode].push(item);
  if (r.type === "url") out.urls[mode].push(item);
  if (r.type === "port") out.ports[mode].push(item);
}
  res.json(out);
});




router.patch("/rules", async (req: Request, res: Response) => {
  type Section = { ids?: number[]; mode?: Mode; active?: boolean };
  const sections: Partial<Record<"ips" | "urls" | "ports", Section>> = req.body ?? {};

  const updates: Array<{ type: RuleType; ids: number[]; mode: Mode; active: boolean }> = [];
  for (const [key, sec] of Object.entries(sections)) {
    if (!sec || !Array.isArray(sec.ids) || sec.ids.length === 0) continue;
    if (typeof sec.active !== "boolean" || !sec.mode) {
      return res.status(400).json({ error: `section ${key} must include ids[], mode, active` });
    }
    const t = key.slice(0, -1) as RuleType; // "ips"->"ip"
    updates.push({ type: t, ids: sec.ids, mode: sec.mode, active: sec.active });
  }
  if (updates.length === 0) return res.json({ updated: [] });

  const client = await pool.connect();
  const updatedItems: Array<{ id: number; value: string; active: boolean }> = [];
  try {
    await client.query("BEGIN");
    for (const u of updates) {
      const { rows } = await client.query(
        `UPDATE firewall_rules
           SET active = $1
         WHERE type = $2 AND mode = $3 AND id = ANY($4::bigint[])
         RETURNING id, value, active`,
        [u.active, u.type, u.mode, u.ids]
      );
      updatedItems.push(...rows);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    return res.status(500).json({ error: "db_error", detail: String(e) });
  } finally {
    client.release();
  }
  res.json({ updated: updatedItems });
});


export default router;