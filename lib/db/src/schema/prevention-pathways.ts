import { pgTable, serial, text, integer, jsonb, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const preventionPathwaysTable = pgTable("prevention_pathways", {
  id: serial("id").primaryKey(),
  cancerTypeId: integer("cancer_type_id").notNull(),
  riskLevel: text("risk_level").notNull(),
  riskPercentageMin: real("risk_percentage_min"),
  riskPercentageMax: real("risk_percentage_max"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  actions: jsonb("actions").$type<{
    id: number;
    title: string;
    description: string;
    frequency: string;
    provider?: string;
    urgent: boolean;
  }[]>().notNull().default([]),
  screeningFrequency: text("screening_frequency").notNull(),
  lifestyleChanges: jsonb("lifestyle_changes").$type<string[]>().notNull().default([]),
  priority: integer("priority").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPreventionPathwaySchema = createInsertSchema(preventionPathwaysTable).omit({ id: true, createdAt: true });
export type InsertPreventionPathway = z.infer<typeof insertPreventionPathwaySchema>;
export type PreventionPathway = typeof preventionPathwaysTable.$inferSelect;
