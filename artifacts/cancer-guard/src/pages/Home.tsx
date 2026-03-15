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
  Eye,
  EyeOff,
  Send,
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

type Stage =
  | "cancer_selection"
  | "ask_first_name"
  | "ask_last_name"
  | "ask_username"
  | "ask_password"
  | "generating"
  | "done";

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

function agentMsg(content: string, type: MsgType = "text"): Message {
  return { id: makeId(), role: "agent", type, content };
}

function userMsg(content: string): Message {
  return { id: makeId(), role: "user", type: "text", content };
}

export default function Home() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const sessionId = getSessionId();

  const [stage, setStage] = useState<Stage>("cancer_selection");
  const [messages, setMessages] = useState<Message[]>([
    agentMsg("Welcome to Preventyx 👋 I'm your cancer prevention guide, built on Cancer Care Ontario guidelines."),
    agentMsg("Let's start by setting up your account and finding the right prevention plan for you.\n\nWhich type of cancer would you like to explore?", "cancer_buttons"),
  ]);

  const [cancerType, setCancerType] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (stage !== "cancer_selection" && stage !== "generating" && stage !== "done") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [stage]);

  const addAgent = (content: string, type: MsgType = "text") =>
    setMessages(prev => [...prev, agentMsg(content, type)]);

  const handleCancerSelect = (type: string) => {
    if (stage !== "cancer_selection") return;
    setCancerType(type);
    setMessages(prev => [
      ...prev,
      userMsg(type),
      agentMsg(`Great choice — I'll build your ${type} prevention plan.\n\nFirst, what's your first name?`),
    ]);
    setStage("ask_first_name");
  };

  const handleInputSubmit = async () => {
    if (!inputValue.trim() || isProcessing) return;
    const val = inputValue.trim();
    setInputValue("");
    setError("");

    if (stage === "ask_first_name") {
      setFirstName(val);
      setMessages(prev => [
        ...prev,
        userMsg(val),
        agentMsg(`Nice to meet you, ${val}! And your last name?`),
      ]);
      setStage("ask_last_name");

    } else if (stage === "ask_last_name") {
      setLastName(val);
      setMessages(prev => [
        ...prev,
        userMsg(val),
        agentMsg("Perfect. Now choose a username for your Preventyx account:"),
      ]);
      setStage("ask_username");

    } else if (stage === "ask_username") {
      if (val.length < 3) {
        setError("Username must be at least 3 characters.");
        setInputValue(val);
        return;
      }
      setUsername(val);
      setMessages(prev => [
        ...prev,
        userMsg(val),
        agentMsg("Almost there! Choose a password (at least 6 characters):"),
      ]);
      setStage("ask_password");

    } else if (stage === "ask_password") {
      if (val.length < 6) {
        setError("Password must be at least 6 characters.");
        setInputValue(val);
        return;
      }
      setPassword(val);
      setMessages(prev => [
        ...prev,
        userMsg("••••••••"),
        agentMsg("Creating your account and generating your personalized care plan…", "spinner"),
      ]);
      setStage("generating");
      await runGeneration(val);
    }
  };

  const runGeneration = async (pwd: string) => {
    setIsProcessing(true);
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");

    try {
      const [regRes, planRes] = await Promise.all([
        fetch(`${base}/api/profiles/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            firstName,
            lastName,
            username,
            password: pwd,
          }),
        }),
        fetch(`${base}/api/agent/intake`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cancerType,
            riskLevel: "average",
            sessionId,
            answers: [],
            questions: [],
          }),
        }),
      ]);

      if (!regRes.ok) {
        const regErr = await regRes.json();
        setMessages(prev => [
          ...prev.filter(m => m.type !== "spinner"),
          agentMsg(regErr.message ?? "That username may already be taken. Let's try another."),
        ]);
        setStage("ask_username");
        setIsProcessing(false);
        return;
      }

      if (!planRes.ok) throw new Error("Care plan generation failed");

      const planData = await planRes.json();
      const planId = planData.id ?? planData.carePlanId;
      localStorage.setItem("preventyx_care_plan_id", String(planId));
      localStorage.setItem("preventyx_profile_name", firstName);

      const eventCount = planData.care_plan_events?.length ?? 0;
      const pathway = planData.user_profile?.recommended_pathway ?? `${cancerType} Prevention Plan`;

      setMessages(prev => [
        ...prev.filter(m => m.type !== "spinner"),
        agentMsg(`Welcome, ${firstName}! 🎉 Your account is set up and your care plan is ready.\n\nBased on Cancer Care Ontario guidelines, I've created your **${pathway}** with ${eventCount} scheduled care events.`),
        agentMsg("Head to your dashboard to see your full care calendar, upcoming screenings, and required actions.", "done"),
      ]);
      setStage("done");
    } catch {
      setMessages(prev => [
        ...prev.filter(m => m.type !== "spinner"),
        agentMsg("Something went wrong generating your plan. Please try again."),
      ]);
      setStage("ask_password");
    } finally {
      setIsProcessing(false);
    }
  };

  const inputPlaceholder = {
    ask_first_name: "Your first name…",
    ask_last_name: "Your last name…",
    ask_username: "Choose a username…",
    ask_password: "Choose a password…",
  }[stage as string] ?? "";

  const showInput = ["ask_first_name", "ask_last_name", "ask_username", "ask_password"].includes(stage);
  const isPasswordStage = stage === "ask_password";

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

      {/* Chat container */}
      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-4 py-6 gap-4">
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
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto pb-2 min-h-0"
          style={{ maxHeight: "calc(100vh - 300px)" }}
        >
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "agent" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}

                <div className="max-w-[82%] flex flex-col gap-3">
                  {/* Text bubble */}
                  {(msg.type === "text" || msg.type === "cancer_buttons") && (
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === "agent"
                        ? "bg-white border border-border/50 text-foreground shadow-sm rounded-tl-none"
                        : "bg-primary text-white rounded-tr-none"
                    }`}>
                      {msg.content.split("**").map((part, i) =>
                        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                      )}
                    </div>
                  )}

                  {/* Cancer type buttons */}
                  {msg.type === "cancer_buttons" && stage === "cancer_selection" && (
                    <div className="grid grid-cols-2 gap-2">
                      {CANCER_TYPES.map(ct => (
                        <button
                          key={ct.label}
                          onClick={() => handleCancerSelect(ct.label)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-border/60 hover:border-primary hover:bg-primary/5 text-sm font-medium text-foreground transition-all duration-200 shadow-sm text-left"
                        >
                          <span className="text-base">{ct.icon}</span>
                          <span className="leading-tight">{ct.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Spinner */}
                  {msg.type === "spinner" && (
                    <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white border border-border/50 shadow-sm flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                      {msg.content}
                    </div>
                  )}

                  {/* Done CTA */}
                  {msg.type === "done" && (
                    <div className="flex flex-col gap-3">
                      <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white border border-border/50 shadow-sm text-sm text-foreground">
                        {msg.content}
                      </div>
                      <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm w-fit"
                      >
                        View My Care Plan
                        <ArrowRight className="w-4 h-4" />
                      </button>
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

        {/* Input area */}
        <AnimatePresence>
          {showInput && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="flex flex-col gap-1.5"
            >
              {error && (
                <p className="text-xs text-destructive font-medium px-1">{error}</p>
              )}
              <div className="flex items-center gap-2 bg-white border-2 border-border/50 focus-within:border-primary rounded-2xl px-4 py-3 transition-colors shadow-sm">
                <input
                  ref={inputRef}
                  type={isPasswordStage && !showPassword ? "password" : "text"}
                  value={inputValue}
                  onChange={e => { setInputValue(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleInputSubmit()}
                  placeholder={inputPlaceholder}
                  disabled={isProcessing}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                {isPasswordStage && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
                <button
                  onClick={handleInputSubmit}
                  disabled={!inputValue.trim() || isProcessing}
                  className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer */}
        <p className="text-center text-[11px] text-muted-foreground border-t border-border/30 pt-3">
          For informational purposes only — not a substitute for medical advice. Always consult a healthcare provider.
        </p>
      </div>
    </div>
  );
}
