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
import { add_type, delete_type } from "../controller/types_controller";
import { inspect_input } from "../middlewares/validations";
import { get_rules, patch_rules } from "../controller/rules_controller";

const router = Router();

/**
 * POST /:type
 * Body: { values: (string|number)[], mode: "blacklist"|"whitelist" }
 * Now handled by controller/types_controller.ts
 */
router.post("/:type", inspect_input, add_type);

/**
 * DELETE /:type
 * Body: { values: (string|number)[], mode: "blacklist"|"whitelist" }
 * Delegates to helpers (to be converted to Drizzle next).
 */
router.delete("/:type", inspect_input, delete_type);


/**
 * GET /rules
 * Returns grouped active rules using Drizzle select.
 */
router.get("/rules", get_rules);

/**
 * PATCH /rules
 * Body shape example:
 * {
 *   "ips":   { "ids": [1,2], "mode": "blacklist", "active": false },
 *   "urls":  { "ids": [3],   "mode": "whitelist", "active": true  },
 *   "ports": { "ids": [4,5], "mode": "blacklist", "active": true  }
 * }
 */
router.patch("/rules", patch_rules);

export default router;
