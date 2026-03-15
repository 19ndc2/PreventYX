import { pgTable, serial, text, integer, jsonb, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const riskAssessmentsTable = pgTable("risk_assessments", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  age: integer("age").notNull(),
  sex: text("sex").notNull(),
  province: text("province"),
  familyHistory: jsonb("family_history").$type<string[]>().notNull().default([]),
  smokingStatus: text("smoking_status"),
  alcoholConsumption: text("alcohol_consumption"),
  physicalActivity: text("physical_activity"),
  bmi: real("bmi"),
  diet: text("diet"),
  sunExposure: text("sun_exposure"),
  hpvVaccinated: text("hpv_vaccinated"),
  lastScreeningDate: text("last_screening_date"),
  existingConditions: jsonb("existing_conditions").$type<string[]>().notNull().default([]),
  overallRiskScore: real("overall_risk_score").notNull().default(0),
  riskFactors: jsonb("risk_factors").$type<{
    cancerTypeId: number;
    cancerTypeName: string;
    riskScore: number;
    riskLevel: string;
    contributingFactors: string[];
  }[]>().notNull().default([]),
  summary: text("summary").notNull().default(""),
  nextSteps: jsonb("next_steps").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRiskAssessmentSchema = createInsertSchema(riskAssessmentsTable).omit({ id: true, createdAt: true });
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;
export type RiskAssessment = typeof riskAssessmentsTable.$inferSelect;
