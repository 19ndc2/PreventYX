import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { riskAssessmentsTable, preventionPathwaysTable, cancerTypesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function computeRiskScore(data: {
  age: number;
  sex: string;
  familyHistory?: string[];
  smokingStatus?: string;
  alcoholConsumption?: string;
  physicalActivity?: string;
  bmi?: number;
  diet?: string;
  sunExposure?: string;
  hpvVaccinated?: boolean;
  existingConditions?: string[];
}): {
  overallRiskScore: number;
  riskFactors: { cancerTypeId: number; cancerTypeName: string; riskScore: number; riskLevel: string; contributingFactors: string[] }[];
  summary: string;
  nextSteps: string[];
} {
  const cancerTypes = [
    { id: 1, name: "Lung Cancer" },
    { id: 2, name: "Colorectal Cancer" },
    { id: 3, name: "Breast Cancer" },
    { id: 4, name: "Prostate Cancer" },
    { id: 5, name: "Skin Cancer" },
    { id: 6, name: "Cervical Cancer" },
    { id: 7, name: "Bladder Cancer" },
  ];

  const riskFactors: { cancerTypeId: number; cancerTypeName: string; riskScore: number; riskLevel: string; contributingFactors: string[] }[] = [];

  for (const ct of cancerTypes) {
    let score = 10;
    const contributing: string[] = [];

    if (data.age > 60) { score += 20; contributing.push("Age over 60"); }
    else if (data.age > 50) { score += 10; contributing.push("Age over 50"); }
    else if (data.age > 40) { score += 5; contributing.push("Age over 40"); }

    const fh = (data.familyHistory ?? []).map(s => s.toLowerCase());
    if (fh.includes(ct.name.toLowerCase()) || fh.some(f => ct.name.toLowerCase().includes(f))) {
      score += 25; contributing.push("Family history of this cancer");
    }
    if (fh.length > 0) { score += 5; contributing.push("Family history of cancer"); }

    if (ct.id === 1 || ct.id === 7) {
      if (data.smokingStatus === "current") { score += 30; contributing.push("Current smoker"); }
      else if (data.smokingStatus === "former") { score += 15; contributing.push("Former smoker"); }
    }

    if (data.smokingStatus === "current" && ct.id !== 1 && ct.id !== 7) {
      score += 5; contributing.push("Smoking increases general cancer risk");
    }

    if (data.alcoholConsumption === "heavy") { score += 15; contributing.push("Heavy alcohol consumption"); }
    else if (data.alcoholConsumption === "moderate") { score += 5; contributing.push("Moderate alcohol consumption"); }

    if (data.physicalActivity === "sedentary") { score += 10; contributing.push("Sedentary lifestyle"); }
    else if (data.physicalActivity === "active") { score -= 5; }

    if (data.bmi && data.bmi > 30) { score += 10; contributing.push("BMI over 30 (obesity)"); }
    else if (data.bmi && data.bmi > 25) { score += 5; contributing.push("BMI over 25 (overweight)"); }

    if (data.diet === "poor") { score += 8; contributing.push("Poor diet"); }
    else if (data.diet === "excellent") { score -= 5; }

    if (ct.id === 5 && data.sunExposure === "very_high") { score += 20; contributing.push("Very high sun exposure"); }
    else if (ct.id === 5 && data.sunExposure === "high") { score += 10; contributing.push("High sun exposure"); }

    if (ct.id === 6) {
      if (data.sex !== "female") { score = 0; }
      else if (data.hpvVaccinated === false) { score += 15; contributing.push("Not HPV vaccinated"); }
    }

    if (ct.id === 3 && data.sex !== "female") { score = Math.round(score * 0.01); }
    if (ct.id === 4 && data.sex !== "male") { score = 0; }

    score = Math.max(0, Math.min(100, score));

    const riskLevel = score >= 60 ? "very_high" : score >= 40 ? "high" : score >= 20 ? "moderate" : "low";
    riskFactors.push({ cancerTypeId: ct.id, cancerTypeName: ct.name, riskScore: score, riskLevel, contributingFactors: contributing });
  }

  const relevantFactors = riskFactors.filter(r => r.riskScore > 0);
  const overallRiskScore = relevantFactors.length > 0
    ? Math.round(relevantFactors.reduce((acc, r) => acc + r.riskScore, 0) / relevantFactors.length)
    : 10;

  const highRisk = relevantFactors.filter(r => r.riskLevel === "high" || r.riskLevel === "very_high");

  const summary = highRisk.length > 0
    ? `Your assessment indicates elevated risk for ${highRisk.map(r => r.cancerTypeName).join(", ")}. Early detection through regular screening significantly improves outcomes.`
    : `Your overall cancer risk appears to be in the lower range. Maintaining healthy habits and regular check-ups are key to staying protected.`;

  const nextSteps = [
    "Schedule a consultation with your family doctor to discuss your risk profile",
    "Register with your province's cancer screening program",
    ...(data.smokingStatus === "current" ? ["Speak to your doctor about a smoking cessation program"] : []),
    ...(data.physicalActivity === "sedentary" ? ["Aim for 150 minutes of moderate physical activity per week"] : []),
    "Review the personalized prevention pathways below and discuss them with your healthcare provider",
  ];

  return { overallRiskScore, riskFactors, summary, nextSteps };
}

router.post("/risk-assessments", async (req, res) => {
  try {
    const body = req.body;

    if (!body.sessionId || !body.age || !body.sex) {
      res.status(422).json({ error: "validation_error", message: "sessionId, age, and sex are required" });
      return;
    }

    const computed = computeRiskScore({
      age: body.age,
      sex: body.sex,
      familyHistory: body.familyHistory,
      smokingStatus: body.smokingStatus,
      alcoholConsumption: body.alcoholConsumption,
      physicalActivity: body.physicalActivity,
      bmi: body.bmi,
      diet: body.diet,
      sunExposure: body.sunExposure,
      hpvVaccinated: body.hpvVaccinated,
      existingConditions: body.existingConditions,
    });

    const [inserted] = await db.insert(riskAssessmentsTable).values({
      sessionId: body.sessionId,
      age: body.age,
      sex: body.sex,
      province: body.province,
      familyHistory: body.familyHistory ?? [],
      smokingStatus: body.smokingStatus,
      alcoholConsumption: body.alcoholConsumption,
      physicalActivity: body.physicalActivity,
      bmi: body.bmi,
      diet: body.diet,
      sunExposure: body.sunExposure,
      hpvVaccinated: body.hpvVaccinated ? "true" : body.hpvVaccinated === false ? "false" : undefined,
      lastScreeningDate: body.lastScreeningDate,
      existingConditions: body.existingConditions ?? [],
      overallRiskScore: computed.overallRiskScore,
      riskFactors: computed.riskFactors,
      summary: computed.summary,
      nextSteps: computed.nextSteps,
    }).returning();

    const highRiskCancerTypeIds = computed.riskFactors
      .filter(r => r.riskLevel === "high" || r.riskLevel === "very_high" || r.riskLevel === "moderate")
      .map(r => r.cancerTypeId);

    let pathwayRows = await db.select({
      pathway: preventionPathwaysTable,
      cancerTypeName: cancerTypesTable.name,
    })
      .from(preventionPathwaysTable)
      .leftJoin(cancerTypesTable, eq(preventionPathwaysTable.cancerTypeId, cancerTypesTable.id))
      .orderBy(preventionPathwaysTable.priority);

    const recommendedPathways = pathwayRows
      .filter(r => highRiskCancerTypeIds.includes(r.pathway.cancerTypeId))
      .slice(0, 6)
      .map(r => ({ ...r.pathway, cancerTypeName: r.cancerTypeName ?? "" }));

    res.status(201).json({
      ...inserted,
      recommendedPathways,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to create risk assessment" });
  }
});

router.get("/risk-assessments", async (req, res) => {
  try {
    const { sessionId } = req.query;
    let query = db.select().from(riskAssessmentsTable);
    let rows;
    if (sessionId) {
      rows = await db.select().from(riskAssessmentsTable).where(eq(riskAssessmentsTable.sessionId, sessionId as string));
    } else {
      rows = await db.select().from(riskAssessmentsTable);
    }

    const results = await Promise.all(rows.map(async (row) => {
      const highRiskCancerTypeIds = (row.riskFactors as any[])
        .filter(r => r.riskLevel === "high" || r.riskLevel === "very_high" || r.riskLevel === "moderate")
        .map((r: any) => r.cancerTypeId);

      const pathwayRows = await db.select({
        pathway: preventionPathwaysTable,
        cancerTypeName: cancerTypesTable.name,
      })
        .from(preventionPathwaysTable)
        .leftJoin(cancerTypesTable, eq(preventionPathwaysTable.cancerTypeId, cancerTypesTable.id))
        .orderBy(preventionPathwaysTable.priority);

      const recommendedPathways = pathwayRows
        .filter(r => highRiskCancerTypeIds.includes(r.pathway.cancerTypeId))
        .slice(0, 6)
        .map(r => ({ ...r.pathway, cancerTypeName: r.cancerTypeName ?? "" }));

      return { ...row, recommendedPathways };
    }));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to fetch risk assessments" });
  }
});

export default router;
