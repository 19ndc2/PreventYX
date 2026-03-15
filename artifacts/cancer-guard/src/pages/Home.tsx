import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Loader2,
  Bot,
  User,
  ArrowRight,
  LogIn,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { getSessionId } from "@/lib/utils";

const CANCER_TYPES = [
  { label: "Breast Cancer", icon: "🩷" },
  { label: "Colorectal Cancer", icon: "🟠" },
  { label: "Cervical Cancer", icon: "💜" },
  { label: "Lung Cancer", icon: "🫁" },
  { label: "Prostate Cancer", icon: "🔵" },
  { label: "Esophageal Cancer", icon: "🟡" },
  { label: "Endometrial Cancer", icon: "🌸" },
  { label: "Thyroid Cancer", icon: "🟢" },
  { label: "Bladder Cancer", icon: "🔶" },
  { label: "Oropharyngeal Cancer", icon: "🔴" },
  { label: "Ovarian Cancer", icon: "🪷" },
  { label: "Liver Cancer (HCC)", icon: "🟤" },
  { label: "Thymic Cancer", icon: "⚪" },
  { label: "Cervical Lymphadenopathy", icon: "🫀" },
];

interface RiskQuestion {
  question: string;
  isProtective: boolean;
}

type Stage = "not_authed" | "cancer_selection" | "loading_questions" | "questioning" | "generating" | "done";
type MsgType = "text" | "cancer_buttons" | "login_prompt" | "spinner" | "done" | "yesno";

interface Message {
  id: string;
  role: "agent" | "user";
  type: MsgType;
  content: string;
  questionIndex?: number;
}

function makeId() {
  return `${Date.now()}-${Math.random()}`;
}

function agentMsg(content: string, type: MsgType = "text"): Message {
  return { id: makeId(), role: "agent", type, content };
}

function userMsg(content: string): Message {
  return { id: makeId(), role: "user", type: "text", content };
}

function isValidQuestion(q: unknown): q is RiskQuestion {
  return (
    q != null &&
    typeof q === "object" &&
    "question" in q &&
    typeof (q as Record<string, unknown>).question === "string" &&
    ((q as Record<string, unknown>).question as string).trim().length > 0 &&
    "isProtective" in q &&
    typeof (q as Record<string, unknown>).isProtective === "boolean"
  );
}

const FEATURES = [
  "Personalized cancer prevention plans",
  "Based on Cancer Care Ontario guidelines",
  "Care calendar with scheduled screenings",
  "AI advisor for health questions",
];

export default function Home() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const sessionId = getSessionId();

  const displayName = user?.firstName ?? user?.email?.split("@")[0] ?? "there";

  const initialMessages = (): Message[] => [
    agentMsg("Welcome to Preventyx 👋 I'm your cancer prevention guide, built on Cancer Care Ontario guidelines."),
    agentMsg(
      isAuthenticated
        ? `Hi ${displayName}! Which type of cancer would you like a prevention plan for?`
        : "To get started, please log in so I can create your personalized care plan.",
      isAuthenticated ? "cancer_buttons" : "login_prompt"
    ),
  ];

  const [stage, setStage] = useState<Stage>(isAuthenticated ? "cancer_selection" : "not_authed");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCancerType, setSelectedCancerType] = useState<string>("");
  const [questions, setQuestions] = useState<RiskQuestion[]>([]);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [answeredIndex, setAnsweredIndex] = useState(-1);
  const [questionSource, setQuestionSource] = useState<"pinecone" | "static">("static");

  const scrollRef = useRef<HTMLDivElement>(null);
  const questionsAbortRef = useRef<AbortController | null>(null);
  const answerLockRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && stage === "not_authed") {
      setStage("cancer_selection");
      setMessages([
        agentMsg("Welcome to Preventyx 👋 I'm your cancer prevention guide, built on Cancer Care Ontario guidelines."),
        agentMsg(`Welcome back, ${displayName}! Which type of cancer would you like a prevention plan for?`, "cancer_buttons"),
      ]);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLogin = () => {
    login();
  };

  const handleCancerSelect = async (type: string) => {
    if (stage !== "cancer_selection") return;

    if (questionsAbortRef.current) {
      questionsAbortRef.current.abort();
    }
    const abortController = new AbortController();
    questionsAbortRef.current = abortController;
    answerLockRef.current = new Set();

    setSelectedCancerType(type);
    setStage("loading_questions");
    setMessages(prev => [
      ...prev,
      userMsg(type),
      agentMsg("Personalizing your questions…", "spinner"),
    ]);

    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    let qs: RiskQuestion[] = [];
    let source: "pinecone" | "static" = "static";

    try {
      const res = await fetch(`${base}/api/agent/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancerType: type }),
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) return;

      if (res.ok) {
        const data = await res.json();
        const validItems = (data.questions ?? []).filter(isValidQuestion);
        if (validItems.length >= 3) {
          qs = validItems.slice(0, 5);
          source = "pinecone";
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }

    if (qs.length === 0) {
      qs = [
        { question: "Do you have a family history of this type of cancer?", isProtective: false },
        { question: "Are you 50 years of age or older?", isProtective: false },
        { question: "Do you smoke or use tobacco products?", isProtective: false },
      ];
      source = "static";
    }

    setQuestions(qs);
    setQuestionSource(source);
    setAnswers([]);
    setAnsweredIndex(-1);

    setMessages(prev => [
      ...prev.filter(m => m.type !== "spinner"),
      agentMsg(`Great — I'll ask you a few quick questions about **${type}** to personalize your prevention plan. Just answer Yes or No.`),
    ]);

    setStage("questioning");

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { id: makeId(), role: "agent", type: "yesno", content: qs[0].question, questionIndex: 0 },
      ]);
    }, 500);
  };

  const handleAnswer = (yes: boolean, qIdx: number) => {
    if (answeredIndex >= qIdx) return;
    if (answerLockRef.current.has(qIdx)) return;
    answerLockRef.current.add(qIdx);
    setAnsweredIndex(qIdx);

    const newAnswers = [...answers, yes];
    setAnswers(newAnswers);

    setMessages(prev => [...prev, userMsg(yes ? "Yes" : "No")]);

    const nextIdx = qIdx + 1;

    setTimeout(() => {
      if (nextIdx < questions.length) {
        setMessages(prev => [
          ...prev,
          { id: makeId(), role: "agent", type: "yesno" as const, content: questions[nextIdx].question, questionIndex: nextIdx },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          agentMsg(`Thanks! I'm now searching Cancer Care Ontario guidelines to build your personalized **${selectedCancerType}** care plan…`, "spinner"),
        ]);
        setStage("generating");
        runGeneration(selectedCancerType, newAnswers);
      }
    }, 400);
  };

  const runGeneration = async (cancerType: string, finalAnswers?: boolean[]) => {
    setIsProcessing(true);
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const answersToSend = finalAnswers ?? answers;
    const yesCount = answersToSend.filter(Boolean).length;
    const riskLevel = yesCount > 2 ? "high" : yesCount > 0 ? "moderate" : "low";

    try {
      const planRes = await fetch(`${base}/api/agent/intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancerType,
          riskLevel,
          sessionId,
          answers: answersToSend,
          questions: questions.map(q => ({ question: q.question, isProtective: q.isProtective })),
          questionSource,
        }),
      });

      if (!planRes.ok) throw new Error("Care plan generation failed");

      const planData = await planRes.json();
      const planId = planData.id ?? planData.carePlanId;
      localStorage.setItem("preventyx_care_plan_id", String(planId));
      localStorage.setItem("preventyx_profile_name", displayName);

      const eventCount = planData.care_plan_events?.length ?? 0;
      const pathway = planData.user_profile?.recommended_pathway ?? `${cancerType} Prevention Plan`;

      setMessages(prev => [
        ...prev.filter(m => m.type !== "spinner"),
        agentMsg(`Your care plan is ready, ${displayName}! 🎉\n\nI've created your **${pathway}** with ${eventCount} scheduled care events based on Cancer Care Ontario guidelines.`),
        agentMsg("Head to your dashboard to see your full care calendar, upcoming screenings, and required actions.", "done"),
      ]);
      setStage("done");
    } catch {
      setMessages(prev => [
        ...prev.filter(m => m.type !== "spinner"),
        agentMsg("Something went wrong generating your plan. Please try again."),
      ]);
      setStage("cancer_selection");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/60 via-white to-slate-50 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-100/30 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-foreground">
              Prevent<span className="text-primary">yx</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!isLoading && (
              isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/60 border border-secondary">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-foreground hidden sm:block">
                      {user.firstName ?? user.email ?? "User"}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-medium text-sm transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
                >
                  <LogIn className="w-4 h-4" />
                  Log in
                </button>
              )
            )}
          </div>
        </nav>

        {/* Main — two columns */}
        <div className="flex-1 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center py-8">
          {/* Left: Hero */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-xs mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Built for Canadians · Based on Canadian Guidelines
            </div>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-display font-bold tracking-tight text-foreground leading-[1.08] mb-5">
              Your Personal<br />
              <span className="text-primary">Cancer Prevention</span>
              <br />Guide
            </h1>

            <p className="text-base lg:text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg">
              Log in, tell us which cancer you want to prevent, and get a personalized care plan grounded in Cancer Care Ontario clinical pathways.
            </p>

            <ul className="space-y-3 mb-10">
              {FEATURES.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors group"
            >
              Already have a care plan? Go to dashboard
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>

          {/* Right: Chatbot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="w-full"
          >
            <div
              className="bg-white/90 backdrop-blur-sm rounded-3xl border border-border/60 shadow-xl shadow-black/5 overflow-hidden flex flex-col"
              style={{ height: "520px" }}
            >
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50 bg-white/80 shrink-0">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm leading-tight">Preventyx Health Guide</p>
                  <p className="text-xs text-muted-foreground">Online · Cancer Care Ontario guidelines</p>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50"
              >
                <AnimatePresence initial={false}>
                  {messages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "agent" && (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}

                      <div className="max-w-[84%] flex flex-col gap-2">
                        {/* Regular text bubble */}
                        {(msg.type === "text" || msg.type === "cancer_buttons") && (
                          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                            msg.role === "agent"
                              ? "bg-white border border-border/50 text-foreground shadow-sm rounded-tl-none"
                              : "bg-primary text-white rounded-tr-none"
                          }`}>
                            {msg.content.split("**").map((part, i) =>
                              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                            )}
                          </div>
                        )}

                        {/* Login prompt */}
                        {msg.type === "login_prompt" && (
                          <div className="flex flex-col gap-3">
                            <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-none bg-white border border-border/50 shadow-sm text-sm text-foreground">
                              {msg.content}
                            </div>
                            <button
                              onClick={handleLogin}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm w-fit"
                            >
                              <LogIn className="w-4 h-4" />
                              Log in to continue
                            </button>
                          </div>
                        )}

                        {/* Cancer type buttons */}
                        {msg.type === "cancer_buttons" && stage === "cancer_selection" && (
                          <div className="grid grid-cols-2 gap-1.5 mt-1">
                            {CANCER_TYPES.map(ct => (
                              <button
                                key={ct.label}
                                onClick={() => handleCancerSelect(ct.label)}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white border border-border/60 hover:border-primary hover:bg-primary/5 text-xs font-medium text-foreground transition-all duration-200 shadow-sm text-left disabled:opacity-50"
                              >
                                <span className="text-sm">{ct.icon}</span>
                                <span className="leading-tight">{ct.label}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Yes/No question */}
                        {msg.type === "yesno" && typeof msg.questionIndex === "number" && (
                          <div className="flex flex-col gap-2">
                            <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-none bg-white border border-border/50 shadow-sm text-sm text-foreground">
                              <span className="text-[10px] text-muted-foreground block mb-1">
                                Question {msg.questionIndex + 1} of {questions.length}
                              </span>
                              {msg.content}
                            </div>
                            {stage === "questioning" && answeredIndex < msg.questionIndex && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAnswer(true, msg.questionIndex!)}
                                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 text-primary font-semibold text-xs hover:bg-primary hover:text-white transition-all"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                                </button>
                                <button
                                  onClick={() => handleAnswer(false, msg.questionIndex!)}
                                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-muted text-muted-foreground font-semibold text-xs hover:bg-foreground/10 hover:text-foreground transition-all"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> No
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Spinner */}
                        {msg.type === "spinner" && (
                          <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-none bg-white border border-border/50 shadow-sm flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
                            {msg.content.split("**").map((part, i) =>
                              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                            )}
                          </div>
                        )}

                        {/* Done CTA */}
                        {msg.type === "done" && (
                          <div className="flex flex-col gap-2">
                            <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-none bg-white border border-border/50 shadow-sm text-sm text-foreground">
                              {msg.content}
                            </div>
                            <button
                              onClick={() => navigate("/dashboard")}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm w-fit"
                            >
                              View My Care Plan
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {msg.role === "user" && (
                        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5 text-secondary-foreground" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-white border-t border-border/50 shrink-0 text-center">
                {stage === "cancer_selection" && (
                  <p className="text-xs text-muted-foreground">Select a cancer type above to get started</p>
                )}
                {stage === "not_authed" && (
                  <p className="text-xs text-muted-foreground">Log in to unlock your personalized care plan</p>
                )}
                {(stage === "loading_questions" || stage === "questioning") && (
                  <p className="text-xs text-muted-foreground">Answer a few quick questions to personalize your plan</p>
                )}
                {stage === "generating" && (
                  <p className="text-xs text-muted-foreground">Analysing Cancer Care Ontario guidelines…</p>
                )}
                {stage === "done" && (
                  <p className="text-xs text-muted-foreground">Care plan created successfully ✓</p>
                )}
              </div>
            </div>

            <p className="text-center text-[10px] text-muted-foreground mt-3">
              For informational purposes only — not a substitute for medical advice.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
