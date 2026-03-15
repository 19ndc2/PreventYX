import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cancerTypesTable = pgTable("cancer_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  canadianIncidenceRate: text("canadian_incidence_rate").notNull(),
  commonRiskFactors: jsonb("common_risk_factors").$type<string[]>().notNull().default([]),
  earlySymptoms: jsonb("early_symptoms").$type<string[]>().notNull().default([]),
  screeningAge: integer("screening_age").notNull().default(50),
  icon: text("icon"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCancerTypeSchema = createInsertSchema(cancerTypesTable).omit({ id: true, createdAt: true });
export type InsertCancerType = z.infer<typeof insertCancerTypeSchema>;
export type CancerType = typeof cancerTypesTable.$inferSelect;
