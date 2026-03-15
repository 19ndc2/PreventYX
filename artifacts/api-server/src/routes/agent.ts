import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const PINECONE_HOST = process.env.PINECONE_HOST!;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY!;
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE ?? "CancerPathways";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

async function searchPinecone(query: string, topK = 6): Promise<string> {
  const url = `${PINECONE_HOST}/records/namespaces/${PINECONE_NAMESPACE}/search`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Api-Key": PINECONE_API_KEY,
      "Content-Type": "application/json",
      "X-Pinecone-API-Version": "2025-01",
    },
    body: JSON.stringify({
      query: { top_k: topK, inputs: { text: query } },
      fields: ["text", "source"],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinecone search failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    result: { hits: Array<{ fields: { text: string; source?: string }; _score: number }> };
  };

  return data.result.hits
    .map((h, i) => `[Document ${i + 1}] (score: ${h._score.toFixed(3)})\n${h.fields.text}`)
    .join("\n\n---\n\n");
}

router.post("/agent/intake", async (req, res) => {
  try {
    const { cancerType, riskLevel, answers, questions, sessionId, userId } = req.body;

    if (!cancerType || !sessionId) {
      res.status(422).json({ error: "validation_error", message: "cancerType and sessionId are required" });
      return;
    }

    // Build a rich query from the user's intake data
    const riskAnswered = (questions ?? [])
      .map((q: { question: string }, i: number) => `- ${q.question}: ${answers?.[i] ? "Yes" : "No"}`)
      .join("\n");

    const searchQuery = `${cancerType} cancer screening eligibility ${riskLevel} risk Ontario pathways ${riskAnswered}`;

    // Search Pinecone for relevant Cancer Care Ontario guidelines
    const context = await searchPinecone(searchQuery);

    // Build the structured care plan using the AI
    const systemPrompt = `You are a clinical decision support agent for Preventyx, a Canadian cancer prevention platform.
Your role is to generate a structured, personalized care plan based on Cancer Care Ontario guidelines retrieved from a knowledge base.

IMPORTANT RULES:
- Only use information from the provided Cancer Care Ontario documents.
- Always recommend consulting a healthcare provider.
- Output ONLY valid JSON — no markdown, no explanation, no preamble.
- Dates should use YYYY-MM-DD format. Set recommended_start_date relative to today (${new Date().toISOString().split("T")[0]}).
- Be specific to the user's risk level and cancer type.`;

    const userPrompt = `A user has completed the Preventyx intake questionnaire. Generate their personalized care plan.

CANCER TYPE: ${cancerType}
RISK LEVEL: ${riskLevel}
USER ANSWERS:
${riskAnswered || "No detailed answers provided"}

CANCER CARE ONTARIO GUIDELINES (retrieved from knowledge base):
${context}

Generate a JSON object matching this EXACT structure:
{
  "user_profile": {
    "risk_category": "Average" | "High",
    "eligibility_status": "OBSP Average Risk" | "High-Risk OBSP" | "Genetic Assessment Required" | "Not Currently Eligible",
    "logic_rationale": "2-3 sentence explanation of why this person has this risk category and eligibility, citing the specific Ontario guidelines.",
    "cancer_type_name": "${cancerType}",
    "recommended_pathway": "Brief name of the recommended pathway"
  },
  "care_plan_events": [
    {
      "event_id": "evt-1",
      "title": "Event title (e.g. Annual Mammogram)",
      "type": "Screening" | "Prevention" | "Consultation" | "Genetic Testing",
      "provider": "Provider or clinic type (e.g. OBSP Screening Centre, Primary Care Provider)",
      "frequency": "How often (e.g. Annually, Every 6 months, Once)",
      "recommended_start_date": "YYYY-MM-DD",
      "is_recurring": true | false,
      "notes": "Any important notes about this event",
      "clinical_reference": "The Cancer Care Ontario document or guideline this comes from"
    }
  ],
  "required_actions": [
    {
      "action": "Action title (e.g. Get a referral from your doctor)",
      "target": "${cancerType}",
      "status": "Pending",
      "urgency": "High" | "Medium" | "Low"
    }
  ]
}

Return 2-4 care_plan_events and 1-3 required_actions appropriate for this person's risk profile. Return ONLY the JSON object.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    // Parse the JSON response
    let carePlan: any;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      carePlan = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      console.error("Failed to parse AI response:", raw);
      res.status(500).json({ error: "parse_error", message: "AI returned invalid JSON", raw });
      return;
    }

    // Save to the database via internal POST
    const saveRes = await fetch(`http://localhost:${process.env.PORT ?? 8080}/api/care-plans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        userId: userId ?? null,
        user_profile: carePlan.user_profile,
        care_plan_events: carePlan.care_plan_events,
        required_actions: carePlan.required_actions,
      }),
    });

    if (!saveRes.ok) {
      const saveErr = await saveRes.text();
      console.error("Failed to save care plan:", saveErr);
      res.status(500).json({ error: "save_error", message: "Failed to save care plan" });
      return;
    }

    const saved = await saveRes.json();
    res.json({ ...carePlan, id: saved.id, carePlanId: saved.id });
  } catch (err) {
    console.error("Agent intake error:", err);
    res.status(500).json({ error: "internal_error", message: "Agent failed to generate care plan" });
  }
});

export default router;
