
import { Router, Request, Response, NextFunction } from "express";
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




export function inspect_input(req: Request, res: Response, next: NextFunction) {
  const type = parseType(req.params.type);
  if (!type) return res.status(400).json({ error: "type must be ip|url|port" });

  const { values, mode } = req.body as { values?: (string | number)[]; mode?: Mode };
  if (!Array.isArray(values) || !mode) {
    return res.status(400).json({ error: "values[] and mode are required" });
  }

  const errs = validateValues(type, values);
  if (errs.length) {
    return res.status(400).json({ error: "validation_error", details: errs });
  }

  res.locals.validated = { type, mode, values: normalizeValues(type, values) };
  next();
}

