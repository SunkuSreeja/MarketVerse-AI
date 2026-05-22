import { pgTable, serial, text, integer, real, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scenariosTable = pgTable("market_scenarios", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  year: integer("year").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  peakDropPercent: real("peak_drop_percent").notNull(),
  recoveryMonths: integer("recovery_months").notNull(),
  emotionalTheme: text("emotional_theme").notNull(),
  timeline: jsonb("timeline").notNull().$type<Array<{ month: string; event: string; marketMove: number; emotion: string }>>(),
  smartInvestorLesson: text("smart_investor_lesson").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertScenarioSchema = createInsertSchema(scenariosTable).omit({ id: true, createdAt: true });
export type MarketScenario = typeof scenariosTable.$inferSelect;
export type InsertMarketScenario = z.infer<typeof insertScenarioSchema>;
