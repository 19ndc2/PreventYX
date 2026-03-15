import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { preventionPathwaysTable, cancerTypesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/prevention-pathways", async (req, res) => {
  try {
    const { cancerTypeId, riskLevel } = req.query;

    let rows = await db.select({
      pathway: preventionPathwaysTable,
      cancerTypeName: cancerTypesTable.name,
    })
      .from(preventionPathwaysTable)
      .leftJoin(cancerTypesTable, eq(preventionPathwaysTable.cancerTypeId, cancerTypesTable.id))
      .orderBy(preventionPathwaysTable.priority);

    if (cancerTypeId) {
      const id = parseInt(cancerTypeId as string, 10);
      rows = rows.filter(r => r.pathway.cancerTypeId === id);
    }
    if (riskLevel) {
      rows = rows.filter(r => r.pathway.riskLevel === riskLevel);
    }

    const result = rows.map(r => ({
      ...r.pathway,
      cancerTypeName: r.cancerTypeName ?? "",
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch prevention pathways" });
  }
});

export default router;
