import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
  RotateCcw,
} from "lucide-react";
import { useListCancerTypes, useListPreventionPathways } from "@workspace/api-client-react";
import type { CancerType, PreventionPathway } from "@workspace/api-client-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RiskQuestion {
  question: string;
  isProtective: boolean;
  factor: string;
}

type MessageType = "text" | "cancer_cards" | "yesno" | "result" | "spinner";

interface Message {
  id: string;
  role: "agent" | "user";
  type: MessageType;
  content: string;
  cancerTypes?: CancerType[];
  question?: RiskQuestion;
  questionIndex?: number;
  pathway?: PreventionPathway;
  cancerType?: CancerType;
  riskLevel?: string;
}

// ─── Question Generator ───────────────────────────────────────────────────────

function generateQuestion(factor: string): RiskQuestion | null {
  const lower = factor.toLowerCase();

  if (lower.includes("being female") || lower.includes("female sex") || lower.includes("male sex"))
    return null;

  if (lower.includes("smok") && !lower.includes("secondhand"))
    return { question: "Do you currently smoke or use tobacco products?", isProtective: false, factor };
  if (lower.includes("secondhand smoke"))
    return { question: "Are you regularly exposed to secondhand smoke?", isProtective: false, factor };
  if (lower.includes("family history"))
    return { question: "Do you have a family history of this type of cancer?", isProtective: false, factor };
  if (lower.includes("age over") || lower.includes("age (")) {
    const match = lower.match(/(?:age over|age )\s*(\d+)/);
    const age = match ? match[1] : "50";
    return { question: `Are you ${age} years of age or older?`, isProtective: false, factor };
  }
  if (lower.includes("alcohol"))
    return { question: "Do you drink alcohol regularly (more than 1 drink per day)?", isProtective: false, factor };
  if (lower.includes("obesity") || lower.includes("overweight"))
    return { question: "Would you describe yourself as overweight or obese?", isProtective: false, factor };
  if (lower.includes("physical inactivity"))
    return { question: "Do you get less than 150 minutes of physical activity per week?", isProtective: false, factor };
  if (lower.includes("uv radiation") || lower.includes("sun exposure") || lower.includes("sunburn"))
    return { question: "Do you spend time outdoors without SPF 30+ sunscreen regularly?", isProtective: false, factor };
  if (lower.includes("tanning bed"))
    return { question: "Have you used tanning beds in the past?", isProtective: false, factor };
  if (lower.includes("not having received hpv") || (lower.includes("hpv") && lower.includes("not")))
    return { question: "Have you received the HPV vaccine?", isProtective: true, factor };
  if (lower.includes("hpv infection"))
    return { question: "Have you been diagnosed with an HPV infection?", isProtective: false, factor };
  if (lower.includes("radon"))
    return { question: "Have you been exposed to radon gas (e.g., untested basement or older home)?", isProtective: false, factor };
  if (lower.includes("asbestos"))
    return { question: "Have you had occupational exposure to asbestos?", isProtective: false, factor };
  if (lower.includes("chemical exposure"))
    return { question: "Have you had significant exposure to industrial chemicals (dyes, rubber, solvents)?", isProtective: false, factor };
  if (lower.includes("inflammatory bowel"))
    return { question: "Have you been diagnosed with inflammatory bowel disease (Crohn's or colitis)?", isProtective: false, factor };
  if (lower.includes("dense breast"))
    return { question: "Have you been told you have dense breast tissue?", isProtective: false, factor };
  if (lower.includes("hormone replacement") || lower.includes("hrt"))
    return { question: "Are you currently using hormone replacement therapy (HRT)?", isProtective: false, factor };
  if (lower.includes("fair skin") || lower.includes("light hair") || lower.includes("blue eyes"))
    return { question: "Do you have fair skin, light hair, or light-coloured eyes?", isProtective: false, factor };
  if (lower.includes("large number of moles") || (lower.includes("moles") && !lower.includes("family")))
    return { question: "Do you have a large number of moles on your body (more than 50)?", isProtective: false, factor };
  if (lower.includes("african") || lower.includes("caribbean"))
    return { question: "Are you of African or Caribbean descent?", isProtective: false, factor };
  if (lower.includes("high-fat diet") || (lower.includes("red") && lower.includes("meat")) || lower.includes("processed meat"))
    return { question: "Does your diet regularly include red or processed meats?", isProtective: false, factor };
  if (lower.includes("radiation exposure"))
    return { question: "Have you had significant radiation exposure to your head or neck area?", isProtective: false, factor };
  if (lower.includes("weakened immune"))
    return { question: "Do you have a weakened immune system (due to illness or medication)?", isProtective: false, factor };
  if (lower.includes("multiple sexual"))
    return { question: "Have you had multiple sexual partners over your lifetime?", isProtective: false, factor };
  if (lower.includes("chronic bladder"))
    return { question: "Do you have a history of chronic bladder infections or irritation?", isProtective: false, factor };
  if (lower.includes("iodine"))
    return { question: "Do you have a history of iodine deficiency?", isProtective: false, factor };
  if (lower.includes("prior cancer treatment") || lower.includes("cancer treatment"))
    return { question: "Have you previously received cancer treatment (chemotherapy or radiation)?", isProtective: false, factor };
  if (lower.includes("air pollution"))
    return { question: "Do you live or work in an area with high air pollution?", isProtective: false, factor };
  if (lower.includes("late pregnancy") || lower.includes("no children"))
    return { question: "Did you have your first child after age 30, or have no children?", isProtective: false, factor };

  return { question: `Do you have this risk factor: ${factor}?`, isProtective: false, factor };
}

function buildQuestions(cancerType: CancerType): RiskQuestion[] {
  const questions: RiskQuestion[] = [];
  const factors = cancerType.commonRiskFactors ?? [];
  for (const factor of factors) {
    const q = generateQuestion(factor);
    if (q && questions.length < 5) questions.push(q);
  }
  return questions;
}

function calculateRiskLevel(questions: RiskQuestion[], answers: boolean[]): "low" | "moderate" | "high" {
  let score = 0;
  for (let i = 0; i < Math.min(questions.length, answers.length); i++) {
    const q = questions[i];
    const a = answers[i];
    if (!q.isProtective && a) score++;
    if (q.isProtective && !a) score++;
  }
  if (score <= 1) return "low";
  if (score <= 3) return "moderate";
  return "high";
}

function findBestPathway(pathways: PreventionPathway[], riskLevel: string): PreventionPathway | null {
  const exact = pathways.find(p => p.riskLevel === riskLevel);
  if (exact) return exact;
  if (riskLevel === "low") return pathways.find(p => p.riskLevel === "moderate") ?? pathways[0] ?? null;
  if (riskLevel === "high") return pathways.find(p => p.riskLevel === "moderate") ?? pathways[pathways.length - 1] ?? null;
  return pathways[0] ?? null;
}

// ─── Icon mapping ─────────────────────────────────────────────────────────────
const CANCER_EMOJI: Record<string, string> = {
  lungs: "🫁", colon: "🩺", ribbon: "🎗️", shield: "🛡️",
  sun: "☀️", female: "💜", droplet: "💧", thyroid: "🦋",
};

const RISK_COLORS: Record<string, { badge: string; dot: string }> = {
  low:      { badge: "bg-emerald-50 text-emerald-700 border-emerald-200",  dot: "bg-emerald-500" },
  moderate: { badge: "bg-amber-50  text-amber-700  border-amber-200",   dot: "bg-amber-500"  },
  high:     { badge: "bg-red-50    text-red-700    border-red-200",      dot: "bg-red-500"    },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function AgentBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 max-w-[85%]">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-primary/20">
        <ShieldCheck className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-border/60 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm text-sm text-foreground leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm text-sm leading-relaxed max-w-[80%]">
        {children}
      </div>
    </div>
  );
}

function CancerTypeGrid({ types, onSelect }: { types: CancerType[]; onSelect: (t: CancerType) => void }) {
  return (
    <AgentBubble>
      <p className="mb-3 font-medium">Which cancer type are you most concerned about or exposed to?</p>
      <div className="grid grid-cols-2 gap-2">
        {types.map(t => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <span className="text-xl">{CANCER_EMOJI[t.icon ?? ""] ?? "🔬"}</span>
            <span className="text-xs font-semibold text-foreground group-hover:text-primary leading-tight">
              {t.name.replace(" Cancer", "").replace(" (Melanoma)", "")}
            </span>
          </button>
        ))}
      </div>
    </AgentBubble>
  );
}

function YesNoButtons({ onAnswer, disabled }: { onAnswer: (yes: boolean) => void; disabled: boolean }) {
  return (
    <div className="flex gap-2 mt-2 ml-11">
      <button
        disabled={disabled}
        onClick={() => onAnswer(true)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary font-semibold text-sm hover:bg-primary hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <CheckCircle2 className="w-4 h-4" /> Yes
      </button>
      <button
        disabled={disabled}
        onClick={() => onAnswer(false)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted text-muted-foreground font-semibold text-sm hover:bg-foreground/10 hover:text-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <XCircle className="w-4 h-4" /> No
      </button>
    </div>
  );
}

function PathwayResult({ pathway, cancerType, riskLevel }: { pathway: PreventionPathway; cancerType: CancerType; riskLevel: string }) {
  const colors = RISK_COLORS[riskLevel] ?? RISK_COLORS.moderate;
  return (
    <AgentBubble>
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{CANCER_EMOJI[cancerType.icon ?? ""] ?? "🔬"}</span>
          <div>
            <p className="font-bold text-foreground text-sm">{pathway.title}</p>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${colors.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{pathway.description}</p>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Top Actions</p>
          {(pathway.actions ?? []).slice(0, 3).map((action) => (
            <div key={action.id} className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg">
              {action.urgent && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />}
              {!action.urgent && <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />}
              <div>
                <p className="text-xs font-semibold text-foreground">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.frequency}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-1 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1.5">
            <span className="font-semibold text-foreground">Screening:</span> {pathway.screeningFrequency}
          </p>
        </div>

        <Link href={`/pathways`}>
          <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors mt-1">
            View Full Prevention Pathway
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </AgentBubble>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function IntakeAgent() {
  const { data: cancerTypes, isLoading: loadingTypes } = useListCancerTypes();
  const [messages, setMessages] = useState<Message[]>([]);
  const [stage, setStage] = useState<"loading" | "cancer_selection" | "questioning" | "result">("loading");
  const [selectedCancerType, setSelectedCancerType] = useState<CancerType | null>(null);
  const [questions, setQuestions] = useState<RiskQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [answeredIndex, setAnsweredIndex] = useState(-1);
  const [pathway, setPathway] = useState<PreventionPathway | null>(null);
  const [riskLevel, setRiskLevel] = useState<string>("");
  const [fetchingPathway, setFetchingPathway] = useState(false);
  const [carePlanId, setCarePlanId] = useState<number | null>(null);
  const sessionId = useRef<string>(`session-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const { data: pathways } = useListPreventionPathways(
    selectedCancerType ? { cancerTypeId: String(selectedCancerType.id) } : {},
    { query: { enabled: !!selectedCancerType } }
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  const addMessage = (msg: Omit<Message, "id">) => {
    setMessages(prev => [...prev, { ...msg, id: `${Date.now()}-${Math.random()}` }]);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!loadingTypes && cancerTypes && messages.length === 0) {
      setTimeout(() => {
        addMessage({
          role: "agent",
          type: "text",
          content: "Hi! I'm your Preventyx health guide 👋 I'll help you find the right cancer prevention pathway in just a couple of minutes.",
        });
      }, 400);
      setTimeout(() => {
        addMessage({
          role: "agent",
          type: "cancer_cards",
          content: "",
          cancerTypes,
        });
        setStage("cancer_selection");
      }, 1200);
    }
  }, [loadingTypes, cancerTypes]);

  const handleCancerSelect = (type: CancerType) => {
    setSelectedCancerType(type);
    addMessage({ role: "user", type: "text", content: `${CANCER_EMOJI[type.icon ?? ""] ?? "🔬"} ${type.name}` });

    setTimeout(() => {
      addMessage({
        role: "agent",
        type: "text",
        content: `${type.name} is an important one to be proactive about. I'll ask you a few quick questions to personalize your prevention pathway. Please answer honestly — there are no wrong answers.`,
      });
    }, 500);

    const qs = buildQuestions(type);
    setQuestions(qs);
    setCurrentQuestion(0);
    setAnswers([]);
    setAnsweredIndex(-1);

    setTimeout(() => {
      if (qs.length > 0) {
        addMessage({
          role: "agent",
          type: "yesno",
          content: qs[0].question,
          question: qs[0],
          questionIndex: 0,
        });
        setStage("questioning");
      }
    }, 1400);
  };

  const handleAnswer = (yes: boolean, qIdx: number) => {
    if (answeredIndex >= qIdx) return;
    setAnsweredIndex(qIdx);

    addMessage({ role: "user", type: "text", content: yes ? "Yes" : "No" });

    const newAnswers = [...answers, yes];
    setAnswers(newAnswers);
    const nextIdx = qIdx + 1;

    setTimeout(() => {
      if (nextIdx < questions.length) {
        const nextQ = questions[nextIdx];
        addMessage({
          role: "agent",
          type: "yesno",
          content: nextQ.question,
          question: nextQ,
          questionIndex: nextIdx,
        });
        setCurrentQuestion(nextIdx);
      } else {
        setFetchingPathway(true);
        addMessage({ role: "agent", type: "text", content: "Thanks for your answers! Calculating your personalized prevention pathway…" });
        addMessage({ role: "agent", type: "spinner", content: "" });

        setTimeout(async () => {
          const risk = calculateRiskLevel(questions, newAnswers);
          setRiskLevel(risk);
          const matched = pathways ? findBestPathway(pathways as PreventionPathway[], risk) : null;
          setPathway(matched);
          setFetchingPathway(false);

          setMessages(prev => prev.filter(m => m.type !== "spinner"));

          if (matched && selectedCancerType) {
            addMessage({
              role: "agent",
              type: "result",
              content: "",
              pathway: matched,
              cancerType: selectedCancerType,
              riskLevel: risk,
            });

            try {
              const riskMap: Record<string, string> = {
                low: "Average",
                moderate: "Average",
                high: "High",
              };
              const eligibilityMap: Record<string, string> = {
                low: "OBSP Average Risk",
                moderate: "OBSP Average Risk",
                high: "High-Risk OBSP",
              };
              const carePlanPayload = {
                sessionId: sessionId.current,
                user_profile: {
                  risk_category: riskMap[risk] ?? "Average",
                  eligibility_status: eligibilityMap[risk] ?? "OBSP Average Risk",
                  logic_rationale: `${selectedCancerType.name} risk assessment: ${risk} risk level based on ${newAnswers.filter(Boolean).length} of ${questions.length} risk factors present.`,
                  cancer_type_id: selectedCancerType.id,
                  cancer_type_name: selectedCancerType.name,
                },
                care_plan_events: (matched.actions ?? []).map((action, i) => ({
                  event_id: `evt-${i + 1}`,
                  title: action.title,
                  type: action.urgent ? "Screening" : "Prevention",
                  provider: "Your Primary Care Provider",
                  frequency: action.frequency,
                  recommended_start_date: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                  is_recurring: true,
                  notes: action.description ?? null,
                  clinical_reference: selectedCancerType.name,
                })),
                required_actions: (matched.actions ?? [])
                  .filter(a => a.urgent)
                  .map(a => ({
                    action: a.title,
                    target: selectedCancerType.name,
                    status: "Pending",
                    urgency: "High",
                  })),
              };
              const res = await fetch(`${import.meta.env.BASE_URL}api/care-plans`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(carePlanPayload),
              });
              if (res.ok) {
                const saved = await res.json();
                setCarePlanId(saved.id);
              }
            } catch {
              // Non-critical — care plan save failed silently
            }
          } else {
            addMessage({
              role: "agent",
              type: "text",
              content: "I wasn't able to find a specific pathway right now. Please visit our Care Pathways section for full recommendations.",
            });
          }
          setStage("result");
        }, 1800);
      }
    }, 400);
  };

  const handleReset = () => {
    setMessages([]);
    setStage("loading");
    setSelectedCancerType(null);
    setQuestions([]);
    setCurrentQuestion(0);
    setAnswers([]);
    setAnsweredIndex(-1);
    setPathway(null);
    setRiskLevel("");

    setTimeout(() => {
      addMessage({
        role: "agent",
        type: "text",
        content: "Let's start over! Which cancer type would you like to explore?",
      });
      addMessage({ role: "agent", type: "cancer_cards", content: "", cancerTypes });
      setStage("cancer_selection");
    }, 300);
  };

  return (
    <div className="flex flex-col h-full bg-white/60 backdrop-blur-sm rounded-2xl border border-border/60 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-white/80">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-sm">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm text-foreground">Preventyx Health Guide</p>
          <p className="text-xs text-emerald-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </p>
        </div>
        {stage === "result" && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Start over
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
        {loadingTypes && messages.length === 0 && (
          <AgentBubble>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading your health guide…
            </div>
          </AgentBubble>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {msg.role === "user" && msg.type === "text" && (
                <UserBubble>{msg.content}</UserBubble>
              )}

              {msg.role === "agent" && msg.type === "text" && (
                <AgentBubble>{msg.content}</AgentBubble>
              )}

              {msg.role === "agent" && msg.type === "spinner" && (
                <AgentBubble>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Analysing your responses…</span>
                  </div>
                </AgentBubble>
              )}

              {msg.role === "agent" && msg.type === "cancer_cards" && msg.cancerTypes && (
                <CancerTypeGrid
                  types={msg.cancerTypes}
                  onSelect={stage === "cancer_selection" ? handleCancerSelect : () => {}}
                />
              )}

              {msg.role === "agent" && msg.type === "yesno" && msg.question && typeof msg.questionIndex === "number" && (
                <div className="space-y-1">
                  <AgentBubble>
                    <span className="text-xs text-muted-foreground block mb-1">
                      Question {msg.questionIndex + 1} of {questions.length}
                    </span>
                    {msg.content}
                  </AgentBubble>
                  <YesNoButtons
                    onAnswer={(yes) => handleAnswer(yes, msg.questionIndex!)}
                    disabled={answeredIndex >= (msg.questionIndex ?? 0)}
                  />
                </div>
              )}

              {msg.role === "agent" && msg.type === "result" && msg.pathway && msg.cancerType && msg.riskLevel && (
                <PathwayResult
                  pathway={msg.pathway}
                  cancerType={msg.cancerType}
                  riskLevel={msg.riskLevel}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border/50 bg-white/60 space-y-2">
        {stage === "result" && carePlanId && (
          <Link href={`/care-plan/${carePlanId}`}>
            <button className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
              <ClipboardList className="w-4 h-4" />
              View Your Full Care Plan
            </button>
          </Link>
        )}
        <p className="text-[11px] text-muted-foreground text-center">
          For informational purposes only — not a substitute for medical advice.
        </p>
      </div>
    </div>
  );
}
