import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  LogIn,
  HeartPulse,
  MessageSquare,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Personal Dashboard",
    description: "Track your cancer prevention journey with a clear, actionable overview.",
  },
  {
    icon: HeartPulse,
    title: "Health Tracker",
    description: "Log and monitor your health metrics over time.",
  },
  {
    icon: MessageSquare,
    title: "AI Health Advisor",
    description: "Get personalized guidance powered by Cancer Care Ontario guidelines.",
  },
];

export default function Login() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { isAuthenticated, isLoading, login } = useAuth();

  function sanitizeRedirect(value: string | null): string | undefined {
    if (!value || !value.startsWith("/") || value.startsWith("//")) return undefined;
    return value;
  }

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const params = new URLSearchParams(searchString);
      const redirect = sanitizeRedirect(params.get("redirect")) || "/dashboard";
      navigate(redirect, { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate, searchString]);

  const handleLogin = () => {
    const params = new URLSearchParams(searchString);
    const redirect = sanitizeRedirect(params.get("redirect"));
    login(redirect);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-md shadow-primary/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            Prevent<span className="text-primary">yx</span>
          </span>
        </div>
        <button
          onClick={handleLogin}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          <LogIn className="w-4 h-4" />
          Sign in
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-lg shadow-primary/25">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>

          <div className="space-y-3">
            <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight text-foreground">
              Your Cancer Prevention <span className="text-primary">Companion</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-md mx-auto">
              Preventyx helps you stay on top of screenings, track your health, and get personalized prevention guidance based on Cancer Care Ontario guidelines.
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white font-bold text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Replit
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16 max-w-3xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 px-4"
        >
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className="bg-white/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 text-center space-y-3 shadow-sm"
            >
              <div className="mx-auto w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-sm text-foreground">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      <footer className="border-t border-border/30 py-4 text-center">
        <p className="text-[11px] text-muted-foreground">
          For informational purposes only — not a substitute for medical advice. Always consult a healthcare provider.
        </p>
      </footer>
    </div>
  );
}
