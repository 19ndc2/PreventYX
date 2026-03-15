import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  RefreshCw,
  ArrowRight,
  Stethoscope,
  Activity,
  HeartPulse,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

interface CarePlanEvent {
  id: number;
  eventId: string;
  title: string;
  type: string;
  provider: string;
  frequency: string;
  recommendedStartDate?: string;
  isRecurring?: boolean;
  notes?: string;
  clinicalReference?: string;
}

interface CarePlanAction {
  id: number;
  action: string;
  target: string;
  status: string;
  urgency: string;
}

interface CarePlanData {
  id: number;
  age?: number;
  riskCategory: string;
  eligibilityStatus: string;
  logicRationale?: string;
  cancerTypeName?: string;
  createdAt: string;
  events: CarePlanEvent[];
  actions: CarePlanAction[];
}

const RISK_STYLES: Record<string, { badge: string; bg: string; label: string }> = {
  Average: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", bg: "from-emerald-500 to-teal-500", label: "Average Risk" },
  High:    { badge: "bg-red-50 text-red-700 border-red-200",             bg: "from-red-500 to-orange-500",   label: "High Risk"    },
  low:     { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", bg: "from-emerald-500 to-teal-500", label: "Low Risk"     },
  moderate:{ badge: "bg-amber-50 text-amber-700 border-amber-200",       bg: "from-amber-500 to-orange-400", label: "Moderate Risk"},
  high:    { badge: "bg-red-50 text-red-700 border-red-200",             bg: "from-red-500 to-orange-500",   label: "High Risk"    },
};

const URGENCY_STYLES: Record<string, string> = {
  High:   "bg-red-50 border-red-200 text-red-700",
  Medium: "bg-amber-50 border-amber-200 text-amber-700",
  Low:    "bg-emerald-50 border-emerald-200 text-emerald-700",
};

const EVENT_TYPE_ICON: Record<string, React.ElementType> = {
  Screening:   Stethoscope,
  Prevention:  HeartPulse,
  Consultation: Activity,
};

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function CarePlan() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [plan, setPlan] = useState<CarePlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = params.id;
    if (!id) { setError("No care plan ID provided."); setLoading(false); return; }

    fetch(`${import.meta.env.BASE_URL}api/care-plans/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(data => { setPlan(data); setLoading(false); })
      .catch(() => { setError("Could not load your care plan."); setLoading(false); });
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your care plan…</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <p className="text-muted-foreground">{error ?? "Care plan not found."}</p>
        <Link href="/dashboard"><button className="text-primary font-semibold hover:underline">Back to Dashboard</button></Link>
      </div>
    );
  }

  const riskStyle = RISK_STYLES[plan.riskCategory] ?? RISK_STYLES["Average"];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Your Care Plan</h1>
            <p className="text-muted-foreground mt-1">
              {plan.cancerTypeName ? `${plan.cancerTypeName} · ` : ""}
              Generated {new Date(plan.createdAt).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <Link href="/dashboard">
            <button className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              ← Back to Dashboard
            </button>
          </Link>
        </div>
      </motion.div>

      {/* User Profile Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <div className={`rounded-2xl bg-gradient-to-br ${riskStyle.bg} p-0.5 shadow-lg`}>
          <div className="bg-card rounded-[14px] p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${riskStyle.bg} flex items-center justify-center shadow-md`}>
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Risk Profile</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-bold ${riskStyle.badge}`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {riskStyle.label}
                  </span>
                  {plan.age && <span className="text-sm text-muted-foreground">· Age {plan.age}</span>}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Eligibility Status</p>
                <p className="font-semibold text-foreground">{plan.eligibilityStatus}</p>
              </div>
              {plan.logicRationale && (
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Clinical Rationale</p>
                  <p className="text-sm text-foreground leading-relaxed">{plan.logicRationale}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Required Actions */}
      {plan.actions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <h2 className="text-lg font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Required Actions
          </h2>
          <div className="space-y-3">
            {plan.actions.map((act) => {
              const urgencyStyle = URGENCY_STYLES[act.urgency] ?? URGENCY_STYLES["Medium"];
              return (
                <div key={act.id} className={`flex items-start gap-4 p-4 rounded-xl border ${urgencyStyle}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{act.action}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 border border-current">
                        {act.urgency} Priority
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 border border-current">
                        {act.status}
                      </span>
                    </div>
                    <p className="text-sm mt-1 opacity-80">{act.target}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Care Plan Events */}
      {plan.events.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <h2 className="text-lg font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Care Plan Events
          </h2>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-4 pl-14 relative">
              {plan.events.map((event, i) => {
                const Icon = EVENT_TYPE_ICON[event.type] ?? CheckCircle2;
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.07 }}
                    className="relative"
                  >
                    <div className="absolute -left-[46px] w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-foreground">{event.title}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                              {event.type}
                            </span>
                            {event.isRecurring && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground flex items-center gap-1">
                                <RefreshCw className="w-2.5 h-2.5" /> Recurring
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{event.provider}</p>
                          {event.notes && <p className="text-sm text-muted-foreground mt-1 italic">{event.notes}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                            <Clock className="w-3 h-3" />
                            {event.frequency}
                          </div>
                          {event.recommendedStartDate && (
                            <div className="flex items-center gap-1 text-xs text-primary font-medium mt-1 justify-end">
                              <Calendar className="w-3 h-3" />
                              {formatDate(event.recommendedStartDate)}
                            </div>
                          )}
                        </div>
                      </div>
                      {event.clinicalReference && (
                        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50 italic">
                          📋 {event.clinicalReference}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-foreground">Want to explore more prevention options?</p>
            <p className="text-sm text-muted-foreground mt-0.5">Browse our full cancer prevention library and pathways.</p>
          </div>
          <Link href="/pathways">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors">
              View All Pathways <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
