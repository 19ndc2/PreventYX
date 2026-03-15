import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { cancerTypesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/cancer-types", async (_req, res) => {
  try {
    const types = await db.select().from(cancerTypesTable).orderBy(cancerTypesTable.name);
    res.json(types);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch cancer types" });
  }
});

router.get("/cancer-types/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "bad_request", message: "Invalid ID" });
      return;
    }
    const [type] = await db.select().from(cancerTypesTable).where(eq(cancerTypesTable.id, id));
    if (!type) {
      res.status(404).json({ error: "not_found", message: "Cancer type not found" });
      return;
    }
    res.json(type);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch cancer type" });
  }
});

export default router;
