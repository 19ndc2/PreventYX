import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Activity, BrainCircuit, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@workspace/replit-auth-web";

export default function Home() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-multiply">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-abstract.png`}
          alt="Abstract background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <nav className="flex items-center justify-between mb-24">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-foreground">
              Cancer<span className="text-primary">Guard</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="font-semibold text-muted-foreground hover:text-primary transition-colors">
              Go to Dashboard
            </Link>
            {!isLoading && (
              isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/60 border border-secondary">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {user.firstName ?? user.email ?? "User"}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-medium text-sm transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
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

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-secondary text-primary font-medium text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Built for Canadians
            </div>
            <h1 className="text-5xl lg:text-7xl font-display font-bold tracking-tight text-foreground leading-[1.1] mb-6">
              Take Control of Your <br />
              <span className="text-gradient">Cancer Prevention</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
              AI-powered personalized screening pathways, risk assessments, and proactive health tracking based on Canadian guidelines. Early detection saves lives.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/risk-assessment" className="inline-block">
                <Button size="lg" className="w-full sm:w-auto text-lg gap-2 group">
                  Start Risk Assessment
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/cancer-types" className="inline-block">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg bg-white/50 backdrop-blur-sm">
                  Explore Cancer Library
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="glass-panel rounded-3xl p-8 max-w-md mx-auto transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                  <Activity className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl">Personalized Risk Profile</h3>
                  <p className="text-muted-foreground text-sm">Updated today</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                {[
                  { name: "Colorectal", risk: "Low", pct: 12 },
                  { name: "Skin", risk: "Moderate", pct: 45 },
                  { name: "Lung", risk: "Low", pct: 5 },
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border/50">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${item.pct}%` }} />
                      </div>
                      <span className="text-sm font-bold w-8 text-right">{item.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex items-start gap-3">
                <BrainCircuit className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div>
                  <p className="text-sm font-medium text-foreground">AI Insight</p>
                  <p className="text-xs text-muted-foreground mt-1">Based on your family history, we recommend scheduling a dermatology check-up within the next 3 months.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-32 pt-16 border-t border-border/50">
          <p className="text-center text-sm text-muted-foreground max-w-3xl mx-auto">
            Disclaimer: CancerGuard provides informational risk assessments based on general guidelines. It is not a diagnostic tool and does not substitute professional medical advice. Always consult with a healthcare provider for medical decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
