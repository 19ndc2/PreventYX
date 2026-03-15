import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@workspace/replit-auth-web";
import IntakeAgent from "@/components/IntakeAgent";

export default function Home() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 z-0 opacity-30 mix-blend-multiply pointer-events-none">
        <img
          src={`${import.meta.env.BASE_URL}images/hero-abstract.png`}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/95" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Nav */}
        <nav className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-foreground">
              Prevent<span className="text-primary">yx</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="font-semibold text-muted-foreground hover:text-primary transition-colors text-sm hidden sm:block">
              Go to Dashboard
            </Link>
            {!isLoading && (
              isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/60 border border-secondary">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-primary" />
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
                    <span className="hidden sm:block">Log out</span>
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

        {/* Hero */}
        <div className="grid lg:grid-cols-2 gap-12 items-start py-8 lg:py-12">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/60 border border-secondary text-primary font-medium text-xs mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Built for Canadians · Based on Canadian Guidelines
            </div>

            <h1 className="text-4xl lg:text-6xl font-display font-bold tracking-tight text-foreground leading-[1.1] mb-5">
              Your Personal<br />
              <span className="text-gradient">Cancer Prevention</span>
              <br />Guide
            </h1>

            <p className="text-base lg:text-lg text-muted-foreground mb-8 leading-relaxed">
              Answer a few questions and our AI guide will instantly match you to a personalized prevention pathway — screenings, lifestyle changes, and next steps tailored to your risk.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto gap-2 group">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/cancer-types">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/50 backdrop-blur-sm">
                  Cancer Library
                </Button>
              </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: "8", label: "Cancer types covered" },
                { value: "10+", label: "Prevention pathways" },
                { value: "100%", label: "Canadian guidelines" },
              ].map(stat => (
                <div key={stat.label} className="bg-white/60 backdrop-blur-sm border border-border/60 rounded-xl p-3 text-center">
                  <p className="font-display font-bold text-xl text-primary">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Intake Agent Chat */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="h-[540px] lg:h-[580px]"
          >
            <IntakeAgent />
          </motion.div>
        </div>

        {/* Footer disclaimer */}
        <div className="py-8 border-t border-border/40">
          <p className="text-center text-xs text-muted-foreground max-w-3xl mx-auto">
            Disclaimer: Preventyx provides informational risk assessments based on general guidelines. It is not a diagnostic tool and does not substitute professional medical advice. Always consult with a healthcare provider for medical decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
