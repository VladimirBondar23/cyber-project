import { pgTable, bigserial, boolean, text } from "drizzle-orm/pg-core";

export const firewallRules = pgTable("firewall_rules", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  type: text("type").$type<"ip" | "url" | "port">().notNull(),
  mode: text("mode").$type<"blacklist" | "whitelist">().notNull(),
  value: text("value").notNull(),
  active: boolean("active").notNull().default(true),
});

export type FirewallRule = typeof firewallRules.$inferSelect;
export type NewFirewallRule = typeof firewallRules.$inferInsert;
