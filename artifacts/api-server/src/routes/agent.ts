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

router.post("/agent/questions", async (req, res) => {
  try {
    const { cancerType } = req.body;

    if (!cancerType) {
      res.status(422).json({ error: "validation_error", message: "cancerType is required" });
      return;
    }

    const searchQuery = `${cancerType} cancer risk factors screening eligibility criteria Ontario pathways`;
    const context = await searchPinecone(searchQuery, 4);

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `You are a clinical intake assistant for Preventyx, a Canadian cancer prevention platform.
Given Cancer Care Ontario (CCO) guideline excerpts about a specific cancer type, generate 3–5 Yes/No screening questions that identify the most important risk factors and protective factors for that cancer.

RULES:
- Each question must be answerable with Yes or No.
- Questions should be clinically relevant, drawn from the risk factors and screening criteria in the provided documents.
- Include at least one question about a protective factor (e.g., vaccination, healthy behavior) if applicable. Mark it with "isProtective": true.
- Questions should be conversational and empathetic, not clinical jargon.
- Return ONLY a JSON array — no markdown, no explanation.
- Each element: { "question": "...", "isProtective": boolean }
- Return between 3 and 5 questions.`,
        },
        {
          role: "user",
          content: `Cancer type: ${cancerType}

Cancer Care Ontario guideline excerpts:
${context}

Generate 3–5 Yes/No risk screening questions for this cancer type based on these guidelines.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let questions: Array<{ question: string; isProtective: boolean }>;
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      questions = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      console.error("Failed to parse AI questions response:", raw);
      res.status(500).json({ error: "parse_error", message: "AI returned invalid JSON" });
      return;
    }

    if (!Array.isArray(questions)) {
      res.status(500).json({ error: "invalid_response", message: "AI did not return an array" });
      return;
    }

    const validated = questions.filter(
      (q): q is { question: string; isProtective: boolean } =>
        q != null &&
        typeof q.question === "string" &&
        q.question.trim().length > 0 &&
        typeof q.isProtective === "boolean"
    );

    if (validated.length < 3) {
      res.status(500).json({ error: "insufficient_questions", message: `AI returned only ${validated.length} valid questions (minimum 3)` });
      return;
    }

    res.json({ questions: validated.slice(0, 5), source: "pinecone" });
  } catch (err) {
    console.error("Agent questions error:", err);
    res.status(500).json({ error: "internal_error", message: "Failed to generate questions" });
  }
});

router.post("/agent/intake", async (req, res) => {
  try {
    const { cancerType, riskLevel, answers, questions, sessionId, userId, questionSource } = req.body;

    if (!cancerType || !sessionId) {
      res.status(422).json({ error: "validation_error", message: "cancerType and sessionId are required" });
      return;
    }

    const riskAnswered = (questions ?? [])
      .map((q: { question: string }, i: number) => `- ${q.question}: ${answers?.[i] ? "Yes" : "No"}`)
      .join("\n");

    const searchQuery = `${cancerType} cancer screening eligibility ${riskLevel} risk Ontario pathways ${riskAnswered}`;

    // Search Pinecone for relevant Cancer Care Ontario guidelines
    const context = await searchPinecone(searchQuery);

    // Build the structured care plan using the AI
    const systemPrompt = `You are a clinical decision support agent for Preventyx, a Canadian cancer prevention platform.
Your role is to generate a structured, personalized care plan based on Cancer Care Ontario (CCO) guidelines retrieved from a knowledge base.

IMPORTANT RULES:
- Only use information from the provided Cancer Care Ontario documents.
- Always recommend consulting a healthcare provider.
- Output ONLY valid JSON — no markdown, no explanation, no preamble.
- Dates should use YYYY-MM-DD format. Today is ${new Date().toISOString().split("T")[0]}.
- Be specific to the user's risk level and cancer type.

OFFICIAL CCO SCREENING INTERVALS (strictly enforce these — never schedule events closer together than stated):
- Breast Cancer (average risk, ages 40-74): Mammogram every 2 YEARS. First event ~1 month from today. Next event 2 years later.
- Breast Cancer (high risk, ages 30-69): Annual mammogram + breast MRI. Events every 12 MONTHS, staggered 6 months apart.
- Cervical Cancer (HPV screening, ages 25-70): HPV test every 5 YEARS (updated March 2025). First event ~2 months from today.
- Colorectal Cancer (average risk, ages 50-74): FIT (Fecal Immunochemical Test) kit every 2 YEARS. Colonoscopy only if high-risk (family history): every 5-10 YEARS.
- Lung Cancer (ages 55-80, must be heavy smoker 20+ pack-years): Annual low-dose CT (LDCT). Eligibility assessment MUST come first as an event, 2 weeks from today, before any LDCT.

CANCERS WITH NO ORGANIZED ONTARIO SCREENING PROGRAM (Prostate, Esophageal, Endometrial, Thyroid, Bladder, Oropharyngeal, Ovarian, Liver/HCC, Thymic, Cervical Lymphadenopathy):
- These require a GP referral → specialist assessment pathway.
- Event 1 (ALWAYS first): "Family Doctor Referral Consultation" — 2-4 weeks from today.
- Event 2: Specialist consultation or diagnostic workup — 6-8 weeks from today.
- Event 3 (if applicable): Follow-up imaging/biopsy — 3-6 months from today.
- Ongoing surveillance events: space at minimum 6-12 months apart based on the guidelines in the documents.
- Do NOT invent organized population screening intervals that do not exist in Ontario for these cancers.

PREREQUISITE LOGIC (enforce ordering):
- For Lung: Risk assessment questionnaire event MUST precede any LDCT scan event.
- For Colorectal high-risk: FIT test or GP consultation MUST precede colonoscopy referral.
- For all non-organized-program cancers: GP referral MUST be Event 1 before any specialist or test.
- Use event notes to clearly state "Complete this step before proceeding to the next event."

EVENT SPACING — NEVER schedule two events less than 4 weeks apart unless they are of clearly different types (e.g., a GP referral followed by a blood test). All screening/surveillance events must respect the intervals above.`;


    const questionSourceNote = questionSource === "pinecone"
      ? "NOTE: The intake questions below were dynamically generated from Pinecone-sourced Cancer Care Ontario guidelines specific to this cancer type. The questions already reflect the key risk factors from the CCO documents, so weight the user's answers accordingly when determining risk."
      : "NOTE: The intake questions below were generated from a standard risk factor template.";

    const userPrompt = `A user has completed the Preventyx intake questionnaire. Generate their personalized care plan.

${questionSourceNote}

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
      "step": 1,
      "title": "Event title (e.g. Family Doctor Referral Consultation)",
      "type": "Screening" | "Prevention" | "Consultation" | "Genetic Testing" | "Diagnostic",
      "provider": "Provider or clinic type (e.g. OBSP Screening Centre, Primary Care Provider, Gastroenterologist)",
      "frequency": "How often (e.g. Every 2 Years, Every 5 Years, Annually, Once)",
      "recommended_start_date": "YYYY-MM-DD",
      "is_recurring": true | false,
      "prerequisite_event_id": null | "evt-1",
      "notes": "Clinical note — if this event must come before the next, state: 'Complete this step before proceeding to Step 2.'",
      "clinical_reference": "The Cancer Care Ontario document or guideline this comes from"
    }
  ],
  "required_actions": [
    {
      "action": "Action title (e.g. Obtain a referral from your family doctor)",
      "target": "${cancerType}",
      "status": "Pending",
      "urgency": "High" | "Medium" | "Low"
    }
  ]
}

CRITICAL REQUIREMENTS FOR care_plan_events:
1. Include a sequential "step" number for each event (1, 2, 3…) reflecting the correct order.
2. Set "prerequisite_event_id" to the event_id of the step that must be completed BEFORE this one (or null for the first event).
3. Use the OFFICIAL CCO intervals from the system prompt — do not invent intervals.
4. Space events correctly: GP referral first (2-4 weeks from today), specialist next (6-8 weeks), then tests/imaging (months later).
5. For cancers with no organized Ontario screening program, always start with a GP referral as Step 1.
6. Return 3-5 care_plan_events and 1-3 required_actions. Return ONLY the JSON object.`;

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
