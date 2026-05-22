import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const simulationsTable = pgTable("simulations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  investmentStyle: text("investment_style").notNull(),
  monthlyAmount: real("monthly_amount").notNull(),
  riskLevel: integer("risk_level").notNull(),
  diversification: real("diversification").notNull(),
  timeHorizonYears: integer("time_horizon_years").notNull(),
  startingAmount: real("starting_amount").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertSimulationSchema = createInsertSchema(simulationsTable).omit({ id: true, createdAt: true });
export type Simulation = typeof simulationsTable.$inferSelect;
export type InsertSimulation = z.infer<typeof insertSimulationSchema>;
