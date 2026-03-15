import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { carePlansTable, carePlanEventsTable, carePlanActionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/care-plans", async (req, res) => {
  try {
    const { sessionId, userId, user_profile, care_plan_events, required_actions } = req.body;

    if (!sessionId || !user_profile) {
      res.status(422).json({ error: "validation_error", message: "sessionId and user_profile are required" });
      return;
    }

    const [plan] = await db.insert(carePlansTable).values({
      sessionId,
      userId: userId ?? null,
      age: user_profile.age ?? null,
      riskCategory: user_profile.risk_category ?? "Average",
      eligibilityStatus: user_profile.eligibility_status ?? "",
      logicRationale: user_profile.logic_rationale ?? null,
      cancerTypeId: user_profile.cancer_type_id ?? null,
      cancerTypeName: user_profile.cancer_type_name ?? null,
    }).returning();

    if (care_plan_events?.length) {
      await db.insert(carePlanEventsTable).values(
        care_plan_events.map((e: any) => ({
          carePlanId: plan.id,
          eventId: e.event_id,
          title: e.title,
          type: e.type,
          provider: e.provider,
          frequency: e.frequency,
          recommendedStartDate: e.recommended_start_date ?? null,
          isRecurring: e.is_recurring ?? false,
          notes: e.notes ?? null,
          clinicalReference: e.clinical_reference ?? null,
        }))
      );
    }

    if (required_actions?.length) {
      await db.insert(carePlanActionsTable).values(
        required_actions.map((a: any) => ({
          carePlanId: plan.id,
          action: a.action,
          target: a.target,
          status: a.status ?? "Pending",
          urgency: a.urgency ?? "Medium",
        }))
      );
    }

    const events = await db.select().from(carePlanEventsTable).where(eq(carePlanEventsTable.carePlanId, plan.id));
    const actions = await db.select().from(carePlanActionsTable).where(eq(carePlanActionsTable.carePlanId, plan.id));

    res.status(201).json({ ...plan, events, actions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to save care plan" });
  }
});

router.get("/care-plans", async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      res.status(422).json({ error: "validation_error", message: "sessionId is required" });
      return;
    }
    const plans = await db.select().from(carePlansTable)
      .where(eq(carePlansTable.sessionId, sessionId as string))
      .orderBy(carePlansTable.createdAt);

    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch care plans" });
  }
});

router.get("/care-plans/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "bad_request", message: "Invalid ID" });
      return;
    }
    const [plan] = await db.select().from(carePlansTable).where(eq(carePlansTable.id, id));
    if (!plan) {
      res.status(404).json({ error: "not_found", message: "Care plan not found" });
      return;
    }
    const events = await db.select().from(carePlanEventsTable).where(eq(carePlanEventsTable.carePlanId, id));
    const actions = await db.select().from(carePlanActionsTable).where(eq(carePlanActionsTable.carePlanId, id));

    res.json({ ...plan, events, actions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch care plan" });
  }
});

export default router;
