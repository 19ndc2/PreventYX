import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { healthLogsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/health-logs", async (req, res) => {
  try {
    const { sessionId, logType, title, date, description, value, unit, tags } = req.body;

    if (!sessionId || !logType || !title || !date) {
      res.status(422).json({ error: "validation_error", message: "sessionId, logType, title, and date are required" });
      return;
    }

    const [inserted] = await db.insert(healthLogsTable).values({
      sessionId,
      logType,
      title,
      date,
      description,
      value,
      unit,
      tags: tags ?? [],
    }).returning();

    res.status(201).json(inserted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to create health log" });
  }
});

router.get("/health-logs", async (req, res) => {
  try {
    const { sessionId, logType } = req.query;
    let rows;
    if (sessionId) {
      rows = await db.select().from(healthLogsTable).where(eq(healthLogsTable.sessionId, sessionId as string));
    } else {
      rows = await db.select().from(healthLogsTable);
    }
    if (logType) {
      rows = rows.filter(r => r.logType === logType);
    }
    rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch health logs" });
  }
});

export default router;
