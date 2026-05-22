import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const challengesTable = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  scenario: text("scenario").notNull(),
  options: jsonb("options").notNull().$type<Array<{ id: string; text: string }>>(),
  correctOptionId: text("correct_option_id").notNull(),
  explanation: text("explanation").notNull(),
  emotionalInsight: text("emotional_insight"),
  pointsReward: integer("points_reward").notNull().default(100),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertChallengeSchema = createInsertSchema(challengesTable).omit({ id: true, createdAt: true });
export type Challenge = typeof challengesTable.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
