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



export async function add_type(req: Request, res: Response) {
  const { type, mode, values } = res.locals.validated!;
  await upsertRules(type, mode as Mode, values);
  return res.json({ type, mode, values, status: "success" });
}

export async function delete_type(req: Request, res: Response) {
  const { type, mode, values } = res.locals.validated!;
  await deleteRules(type, mode as Mode, values);
  return res.json({ type, mode, values, status: "success" });
}