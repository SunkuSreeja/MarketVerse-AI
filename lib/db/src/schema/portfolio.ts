import { pgTable, serial, text, real, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const portfolioTable = pgTable("portfolio", {
  id: serial("id").primaryKey(),
  totalInvested: real("total_invested").notNull().default(0),
  holdings: jsonb("holdings").notNull().$type<Array<{ symbol: string; name: string; allocation: number; currentValue: number; gainLoss: number }>>(),
  investorIQ: integer("investor_iq").notNull().default(50),
  disciplineScore: integer("discipline_score").notNull().default(50),
  riskBalance: integer("risk_balance").notNull().default(50),
  emotionalStability: integer("emotional_stability").notNull().default(50),
  overallRank: text("overall_rank").notNull().default("Novice"),
  badges: jsonb("badges").notNull().$type<string[]>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertPortfolioSchema = createInsertSchema(portfolioTable).omit({ id: true, updatedAt: true });
export type Portfolio = typeof portfolioTable.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
