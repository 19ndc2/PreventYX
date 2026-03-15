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
  CheckCircle2,
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

  const [stage, setStage] = useState<Stage>("cancer_selection");
  const [messages, setMessages] = useState<Message[]>([
    agentMsg("Hi! I'm your Preventyx health guide 👋 Let's set up your account and find the right prevention plan for you."),
    agentMsg("Which type of cancer would you like a prevention plan for?", "cancer_buttons"),
  ]);

  const [cancerType, setCancerType] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
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
    if (!["cancer_selection", "generating", "done"].includes(stage)) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [stage]);

  const handleCancerSelect = (type: string) => {
    if (stage !== "cancer_selection") return;
    setCancerType(type);
    setMessages(prev => [
      ...prev,
      userMsg(type),
      agentMsg(`Great — I'll build your **${type}** prevention plan.\n\nWhat's your first name?`),
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
        agentMsg("Perfect. Now choose a username for your account:"),
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
      setMessages(prev => [
        ...prev,
        userMsg("••••••••"),
        agentMsg("Creating your account and building your care plan…", "spinner"),
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
        const err = await regRes.json();
        setMessages(prev => [
          ...prev.filter(m => m.type !== "spinner"),
          agentMsg(err.message ?? "That username is already taken. Please try another."),
        ]);
        setStage("ask_username");
        setIsProcessing(false);
        return;
      }

      if (!planRes.ok) throw new Error("Care plan failed");

      const planData = await planRes.json();
      const planId = planData.id ?? planData.carePlanId;
      localStorage.setItem("preventyx_care_plan_id", String(planId));
      localStorage.setItem("preventyx_profile_name", firstName);

      const eventCount = planData.care_plan_events?.length ?? 0;
      const pathway = planData.user_profile?.recommended_pathway ?? `${cancerType} Prevention Plan`;

      setMessages(prev => [
        ...prev.filter(m => m.type !== "spinner"),
        agentMsg(`Welcome, ${firstName}! 🎉 Your account is ready and your care plan has been created.\n\nI've built your **${pathway}** with ${eventCount} scheduled care events based on Cancer Care Ontario guidelines.`),
        agentMsg("Go to your dashboard to see your full care calendar, upcoming screenings, and required actions.", "done"),
      ]);
      setStage("done");
    } catch {
      setMessages(prev => [
        ...prev.filter(m => m.type !== "spinner"),
        agentMsg("Something went wrong. Please try again."),
      ]);
      setStage("ask_password");
    } finally {
      setIsProcessing(false);
    }
  };

  const inputPlaceholder: Record<string, string> = {
    ask_first_name: "Your first name…",
    ask_last_name: "Your last name…",
    ask_username: "Choose a username…",
    ask_password: "Choose a password…",
  };

  const showInput = ["ask_first_name", "ask_last_name", "ask_username", "ask_password"].includes(stage);
  const isPasswordStage = stage === "ask_password";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle background */}
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
                  onClick={login}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
                >
                  <LogIn className="w-4 h-4" />
                  Log in
                </button>
              )
            )}
          </div>
        </nav>

        {/* Main content — two columns */}
        <div className="flex-1 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center py-8">
          {/* Left: Hero copy */}
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
              Create your free account, tell us which cancer you want to prevent, and get a personalized care plan grounded in Cancer Care Ontario clinical pathways.
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
              Already have an account? Go to dashboard
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>

          {/* Right: Registration chatbot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="w-full"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-border/60 shadow-xl shadow-black/5 overflow-hidden flex flex-col"
              style={{ height: "580px" }}
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

                        {msg.type === "cancer_buttons" && stage === "cancer_selection" && (
                          <div className="grid grid-cols-2 gap-1.5 mt-1">
                            {CANCER_TYPES.map(ct => (
                              <button
                                key={ct.label}
                                onClick={() => handleCancerSelect(ct.label)}
                                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white border border-border/60 hover:border-primary hover:bg-primary/5 text-xs font-medium text-foreground transition-all duration-200 shadow-sm text-left"
                              >
                                <span className="text-sm">{ct.icon}</span>
                                <span className="leading-tight">{ct.label}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {msg.type === "spinner" && (
                          <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-none bg-white border border-border/50 shadow-sm flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
                            {msg.content}
                          </div>
                        )}

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

              {/* Input area */}
              <div className="px-4 py-3 bg-white border-t border-border/50 shrink-0">
                <AnimatePresence>
                  {showInput && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="flex flex-col gap-1.5"
                    >
                      {error && (
                        <p className="text-xs text-destructive font-medium">{error}</p>
                      )}
                      <div className="flex items-center gap-2 bg-slate-50 border-2 border-border/50 focus-within:border-primary rounded-xl px-3 py-2.5 transition-colors">
                        <input
                          ref={inputRef}
                          type={isPasswordStage && !showPassword ? "password" : "text"}
                          value={inputValue}
                          onChange={e => { setInputValue(e.target.value); setError(""); }}
                          onKeyDown={e => e.key === "Enter" && handleInputSubmit()}
                          placeholder={inputPlaceholder[stage] ?? ""}
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
                          className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                  {!showInput && stage !== "done" && (
                    <p className="text-xs text-center text-muted-foreground py-1">Select a cancer type above to get started</p>
                  )}
                  {stage === "done" && (
                    <p className="text-xs text-center text-muted-foreground py-1">Account created successfully ✓</p>
                  )}
                </AnimatePresence>
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
