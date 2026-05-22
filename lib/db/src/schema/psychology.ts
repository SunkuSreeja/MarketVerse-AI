import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const psychologyEventsTable = pgTable("psychology_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  context: text("context"),
  severity: integer("severity").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertPsychologyEventSchema = createInsertSchema(psychologyEventsTable).omit({ id: true, createdAt: true });
export type PsychologyEvent = typeof psychologyEventsTable.$inferSelect;
export type InsertPsychologyEvent = z.infer<typeof insertPsychologyEventSchema>;
