import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const carePlansTable = pgTable("care_plans", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  userId: text("user_id"),
  age: integer("age"),
  riskCategory: text("risk_category").notNull(),
  eligibilityStatus: text("eligibility_status").notNull(),
  logicRationale: text("logic_rationale"),
  cancerTypeId: integer("cancer_type_id"),
  cancerTypeName: text("cancer_type_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const carePlanEventsTable = pgTable("care_plan_events", {
  id: serial("id").primaryKey(),
  carePlanId: integer("care_plan_id").notNull(),
  eventId: text("event_id").notNull(),
  step: integer("step"),
  title: text("title").notNull(),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  frequency: text("frequency").notNull(),
  recommendedStartDate: text("recommended_start_date"),
  isRecurring: boolean("is_recurring").default(false),
  notes: text("notes"),
  clinicalReference: text("clinical_reference"),
  prerequisiteEventId: text("prerequisite_event_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const carePlanActionsTable = pgTable("care_plan_actions", {
  id: serial("id").primaryKey(),
  carePlanId: integer("care_plan_id").notNull(),
  action: text("action").notNull(),
  target: text("target").notNull(),
  status: text("status").notNull().default("Pending"),
  urgency: text("urgency").notNull().default("Medium"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCarePlanSchema = createInsertSchema(carePlansTable).omit({ id: true, createdAt: true });
export type InsertCarePlan = z.infer<typeof insertCarePlanSchema>;
export type CarePlan = typeof carePlansTable.$inferSelect;

export const insertCarePlanEventSchema = createInsertSchema(carePlanEventsTable).omit({ id: true, createdAt: true });
export type InsertCarePlanEvent = z.infer<typeof insertCarePlanEventSchema>;
export type CarePlanEvent = typeof carePlanEventsTable.$inferSelect;

export const insertCarePlanActionSchema = createInsertSchema(carePlanActionsTable).omit({ id: true, createdAt: true });
export type InsertCarePlanAction = z.infer<typeof insertCarePlanActionSchema>;
export type CarePlanAction = typeof carePlanActionsTable.$inferSelect;
