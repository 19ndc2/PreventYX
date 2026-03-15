import { Router, type IRouter } from "express";

const router: IRouter = Router();

const FLOWISE_URL = process.env.FLOWISE_API_URL;
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;

router.post("/chat", async (req, res) => {
  try {
    const { message, sessionId, context } = req.body;

    if (!message || !sessionId) {
      res.status(422).json({ error: "validation_error", message: "message and sessionId are required" });
      return;
    }

    if (!FLOWISE_URL) {
      const fallback = generateFallbackResponse(message);
      res.json({ response: fallback, sessionId, sources: [] });
      return;
    }

    const flowiseRes = await fetch(FLOWISE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(FLOWISE_API_KEY ? { "Authorization": `Bearer ${FLOWISE_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        question: message,
        sessionId,
        overrideConfig: context ? { systemMessagePrompt: JSON.stringify(context) } : undefined,
      }),
    });

    if (!flowiseRes.ok) {
      const text = await flowiseRes.text();
      console.error("Flowise error:", flowiseRes.status, text);
      res.status(503).json({ error: "ai_unavailable", message: "AI backend returned an error" });
      return;
    }

    const data = await flowiseRes.json() as { text?: string; response?: string; sourceDocuments?: { pageContent: string }[] };
    const responseText = data.text ?? data.response ?? "I'm sorry, I couldn't generate a response right now.";
    const sources = (data.sourceDocuments ?? []).map((d: { pageContent: string }) => d.pageContent.slice(0, 200));

    res.json({ response: responseText, sessionId, sources });
  } catch (err) {
    console.error(err);
    res.status(503).json({ error: "ai_unavailable", message: "Failed to connect to AI backend" });
  }
});

function generateFallbackResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("lung") || lower.includes("smoking")) {
    return "Lung cancer is the leading cause of cancer death in Canada. Smoking is responsible for about 85% of cases. If you currently smoke, quitting is the single most important step you can take. Even former smokers benefit from lung cancer screening (low-dose CT scan) if they're 50+ with a significant smoking history. I recommend speaking with your doctor about eligibility for the Ontario Lung Screening Program or your province's equivalent.";
  }
  if (lower.includes("breast")) {
    return "Breast cancer is the most common cancer among Canadian women. The Canadian Cancer Society recommends mammogram screening every 2 years starting at age 50 for average-risk women. Those with a family history or BRCA gene mutation may start earlier. Regular self-exams and annual clinical breast exams are also recommended. Maintaining a healthy weight and limiting alcohol consumption can reduce your risk.";
  }
  if (lower.includes("colorectal") || lower.includes("colon")) {
    return "Colorectal cancer is highly preventable through regular screening. Canada's national guidelines recommend colorectal cancer screening starting at age 50 for average-risk individuals. A fecal immunochemical test (FIT) every 1-2 years or a colonoscopy every 10 years are the main options. A diet high in fibre and low in processed red meat, combined with regular exercise, significantly reduces your risk.";
  }
  if (lower.includes("prostate")) {
    return "Prostate cancer is the most common cancer in Canadian men. The Canadian Cancer Society recommends a discussion with your doctor about PSA testing starting at age 50 (or 40-45 for high-risk men with family history or African heritage). Important lifestyle factors include maintaining healthy weight, regular exercise, and a diet rich in vegetables. Speak with your doctor about whether prostate-specific antigen (PSA) testing is right for you.";
  }
  if (lower.includes("skin") || lower.includes("melanoma") || lower.includes("sun")) {
    return "Skin cancer, including melanoma, is one of the most preventable cancers. Key preventive measures include: applying SPF 30+ sunscreen daily, wearing protective clothing and wide-brimmed hats, avoiding tanning beds entirely, seeking shade between 11am-3pm, and performing regular self-skin exams. Canadians should also be aware that UV exposure from the sun can be intense even on cloudy days. Report any unusual moles (asymmetric, irregular border, multiple colours, diameter >6mm, or changing) to your doctor promptly.";
  }
  if (lower.includes("cervical") || lower.includes("pap") || lower.includes("hpv")) {
    return "Cervical cancer is largely preventable through HPV vaccination and regular Pap tests. Canadian guidelines recommend Pap tests every 3 years for women aged 25-69. HPV vaccination is most effective before sexual activity begins but can still protect people up to age 45. Most provinces offer HPV vaccination through school programs. Regular screening can detect pre-cancerous changes before they become cancer.";
  }
  if (lower.includes("screen") || lower.includes("test")) {
    return "Regular cancer screening is one of the most powerful tools for prevention and early detection. In Canada, organized screening programs exist for breast, cervical, and colorectal cancer. Lung cancer screening is available for high-risk individuals in several provinces. Talk to your family doctor or contact your provincial health authority to learn about the screening programs available in your area. Early detection dramatically improves treatment outcomes.";
  }
  if (lower.includes("diet") || lower.includes("food") || lower.includes("nutrition")) {
    return "Diet plays a significant role in cancer prevention. The Canadian Cancer Society recommends: eating plenty of vegetables, fruits, and whole grains; limiting red and processed meats; reducing alcohol consumption; maintaining a healthy weight; and avoiding ultra-processed foods. A plant-forward diet rich in fibre, antioxidants, and phytochemicals provides protective benefits. The Mediterranean diet in particular has strong evidence for reducing cancer risk.";
  }
  if (lower.includes("exercise") || lower.includes("physical") || lower.includes("active")) {
    return "Regular physical activity reduces the risk of several cancers including breast, colorectal, and endometrial cancer. Canada's physical activity guidelines recommend at least 150 minutes of moderate-to-vigorous aerobic activity per week. Even small increases in activity provide benefits. Exercise helps maintain a healthy weight, reduces inflammation, and improves immune function — all of which contribute to cancer prevention. Find activities you enjoy to make it sustainable.";
  }

  return "Thank you for your question about cancer prevention. As an AI assistant, I can provide general information based on Canadian cancer guidelines, but I'm not a substitute for professional medical advice. The most important steps for cancer prevention include: regular screening at recommended ages, maintaining a healthy lifestyle (not smoking, limiting alcohol, staying active, eating well), knowing your family history, and having regular check-ups with your family doctor. For personalized advice, please consult with a healthcare professional. Is there a specific cancer type or prevention strategy you'd like to learn more about?";
}

export default router;
