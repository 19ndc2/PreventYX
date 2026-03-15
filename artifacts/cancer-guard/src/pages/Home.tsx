import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, Bot, User, ArrowRight, LogIn, LogOut, User as UserIcon, RotateCcw } from "lucide-react";
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

type MsgType = "text" | "cancer_buttons" | "spinner" | "done";

interface Message {
  id: string;
  role: "agent" | "user";
  type: MsgType;
  content: string;
}

function makeId() {
  return `${Date.now()}-${Math.random()}`;
}

export default function Home() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const sessionId = getSessionId();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: makeId(),
      role: "agent",
      type: "text",
      content: "Welcome to Preventyx 👋 I'm your cancer prevention guide, powered by Cancer Care Ontario guidelines.",
    },
    {
      id: makeId(),
      role: "agent",
      type: "cancer_buttons",
      content: "Which type of cancer would you like a personalized prevention plan for?",
    },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCancerSelect = async (cancerType: string) => {
    if (isGenerating || done) return;

    setMessages(prev => [
      ...prev,
      { id: makeId(), role: "user", type: "text", content: cancerType },
      { id: makeId(), role: "agent", type: "spinner", content: `Searching Cancer Care Ontario guidelines for ${cancerType}…` },
    ]);

    setIsGenerating(true);

    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/agent/intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancerType,
          riskLevel: "average",
          sessionId,
          answers: [],
          questions: [],
        }),
      });

      if (!res.ok) throw new Error("Agent error");

      const data = await res.json();
      const planId = data.id ?? data.carePlanId;

      localStorage.setItem("preventyx_care_plan_id", String(planId));

      const profile = data.user_profile;
      const eventCount = data.care_plan_events?.length ?? 0;

      setMessages(prev => [
        ...prev.filter(m => m.type !== "spinner"),
        {
          id: makeId(),
          role: "agent",
          type: "text",
          content: `Your personalized prevention plan is ready! Based on Canadian guidelines, I've created a **${profile?.recommended_pathway ?? cancerType + " Prevention Plan"}** with ${eventCount} scheduled care events.`,
        },
        {
          id: makeId(),
          role: "agent",
          type: "done",
          content: "Go to your dashboard to see your full care calendar, upcoming screenings, and required actions.",
        },
      ]);

      setDone(true);
    } catch {
      setMessages(prev => [
        ...prev.filter(m => m.type !== "spinner"),
        {
          id: makeId(),
          role: "agent",
          type: "text",
          content: "Sorry, I had trouble generating your plan. Please try again.",
        },
        { id: makeId(), role: "agent", type: "cancer_buttons", content: "Please select a cancer type to try again:" },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setDone(false);
    setIsGenerating(false);
    setMessages([
      { id: makeId(), role: "agent", type: "text", content: "Welcome back! Let's create another prevention plan." },
      { id: makeId(), role: "agent", type: "cancer_buttons", content: "Which type of cancer would you like a plan for?" },
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-md shadow-primary/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
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
                onClick={login}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                Log in
              </button>
            )
          )}
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 py-6 gap-4">
        {/* Agent identity */}
        <div className="flex items-center gap-3 pb-2">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <p className="font-display font-bold text-base leading-tight">Preventyx Health Guide</p>
            <p className="text-xs text-muted-foreground">Powered by Cancer Care Ontario guidelines</p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-4 min-h-0" style={{ maxHeight: "calc(100vh - 260px)" }}>
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "agent" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}

                <div className="max-w-[80%] flex flex-col gap-3">
                  {msg.type === "text" && (
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "agent"
                        ? "bg-white border border-border/50 text-foreground shadow-sm rounded-tl-none"
                        : "bg-primary text-white rounded-tr-none"
                    }`}>
                      {msg.content.split("**").map((part, i) =>
                        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                      )}
                    </div>
                  )}

                  {msg.type === "spinner" && (
                    <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white border border-border/50 shadow-sm flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                      {msg.content}
                    </div>
                  )}

                  {msg.type === "cancer_buttons" && !done && (
                    <div className="flex flex-col gap-2">
                      <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white border border-border/50 shadow-sm text-sm text-foreground">
                        {msg.content}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                        {CANCER_TYPES.map((ct) => (
                          <button
                            key={ct.label}
                            onClick={() => handleCancerSelect(ct.label)}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-border/60 hover:border-primary hover:bg-primary/5 text-sm font-medium text-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-left"
                          >
                            <span className="text-base">{ct.icon}</span>
                            <span className="leading-tight">{ct.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.type === "done" && (
                    <div className="flex flex-col gap-3">
                      <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white border border-border/50 shadow-sm text-sm text-foreground">
                        {msg.content}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => navigate("/dashboard")}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
                        >
                          View My Care Plan
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleReset}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white text-muted-foreground font-medium text-sm hover:text-foreground hover:border-primary/40 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Start over
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[11px] text-muted-foreground pt-2 border-t border-border/30">
          For informational purposes only — not a substitute for medical advice. Always consult a healthcare provider.
        </p>
      </div>
    </div>
  );
}
