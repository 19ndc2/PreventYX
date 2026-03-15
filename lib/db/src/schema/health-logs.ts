import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const healthLogsTable = pgTable("health_logs", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  logType: text("log_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  date: text("date").notNull(),
  value: text("value"),
  unit: text("unit"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHealthLogSchema = createInsertSchema(healthLogsTable).omit({ id: true, createdAt: true });
export type InsertHealthLog = z.infer<typeof insertHealthLogSchema>;
export type HealthLog = typeof healthLogsTable.$inferSelect;
