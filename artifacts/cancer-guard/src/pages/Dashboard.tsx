import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Stethoscope,
  Activity,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday, parseISO } from "date-fns";
import { getSessionId, cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CarePlanEvent {
  id: number;
  eventId: string;
  title: string;
  type: string;
  provider: string;
  frequency: string;
  recommendedStartDate: string | null;
  isRecurring: boolean;
  notes: string | null;
  clinicalReference: string | null;
}

interface CarePlanAction {
  id: number;
  action: string;
  target: string;
  status: string;
  urgency: string;
}

interface CarePlan {
  id: number;
  cancerTypeName: string | null;
  riskCategory: string;
  eligibilityStatus: string;
  logicRationale: string | null;
  events: CarePlanEvent[];
  actions: CarePlanAction[];
  createdAt: string;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  Screening: "bg-blue-500",
  Prevention: "bg-green-500",
  Consultation: "bg-purple-500",
  "Genetic Testing": "bg-orange-500",
};

const URGENCY_COLORS: Record<string, string> = {
  High: "border-red-200 bg-red-50 text-red-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  Low: "border-green-200 bg-green-50 text-green-700",
};

function fetchCarePlan(sessionId: string, planId: string | null): Promise<CarePlan | null> {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  if (planId) {
    return fetch(`${base}/api/care-plans/${planId}`).then(r => r.ok ? r.json() : null);
  }

  return fetch(`${base}/api/care-plans?sessionId=${sessionId}`)
    .then(r => r.ok ? r.json() : [])
    .then(async (plans: { id: number }[]) => {
      if (!plans.length) return null;
      const latest = plans[plans.length - 1];
      return fetch(`${base}/api/care-plans/${latest.id}`).then(r => r.ok ? r.json() : null);
    });
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const sessionId = getSessionId();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CarePlanEvent | null>(null);

  const storedPlanId = localStorage.getItem("preventyx_care_plan_id");

  const { data: plan, isLoading } = useQuery<CarePlan | null>({
    queryKey: ["care-plan", sessionId, storedPlanId],
    queryFn: () => fetchCarePlan(sessionId, storedPlanId),
    staleTime: 60_000,
  });

  const events = plan?.events ?? [];

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDayOfWeek = startOfMonth(currentMonth).getDay();

  function getEventsForDay(day: Date): CarePlanEvent[] {
    return events.filter(ev => {
      if (!ev.recommendedStartDate) return false;
      return isSameDay(parseISO(ev.recommendedStartDate), day);
    });
  }

  const upcomingEvents = [...events]
    .filter(ev => ev.recommendedStartDate)
    .sort((a, b) => new Date(a.recommendedStartDate!).getTime() - new Date(b.recommendedStartDate!).getTime())
    .slice(0, 6);

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Your Care Calendar</h1>
          {plan && (
            <p className="text-muted-foreground mt-1 text-sm">
              {plan.cancerTypeName ?? "Cancer"} Prevention Plan · {plan.riskCategory} Risk
            </p>
          )}
        </div>
        <Link href="/chat">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors">
            <MessageSquare className="w-4 h-4" />
            Ask AI Advisor
          </button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-muted animate-pulse rounded-2xl" />
          <div className="h-96 bg-muted animate-pulse rounded-2xl" />
        </div>
      ) : !plan ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
          <Calendar className="w-16 h-16 text-muted mx-auto mb-4" />
          <h3 className="text-xl font-display font-bold mb-2">No care plan yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            Start by telling our AI guide which cancer type you'd like prevention guidance for.
          </p>
          <Link href="/">
            <button className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors">
              Get My Care Plan
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-lg">{format(currentMonth, "MMMM yyyy")}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {daysInMonth.map(day => {
                const dayEvents = getEventsForDay(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const isCurrentDay = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      setSelectedDay(isSameDay(day, selectedDay ?? new Date(0)) ? null : day);
                      setSelectedEvent(null);
                    }}
                    className={cn(
                      "relative min-h-[52px] p-1 rounded-xl text-left transition-all duration-200 border",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : isCurrentDay
                        ? "border-primary/30 bg-primary/5"
                        : "border-transparent hover:border-border hover:bg-muted/50"
                    )}
                  >
                    <span className={cn(
                      "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                      isCurrentDay ? "bg-primary text-white" : "text-foreground"
                    )}>
                      {format(day, "d")}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="mt-0.5 space-y-0.5">
                        {dayEvents.slice(0, 2).map(ev => (
                          <div
                            key={ev.id}
                            className={cn(
                              "w-full h-1.5 rounded-full",
                              EVENT_TYPE_COLORS[ev.type] ?? "bg-primary"
                            )}
                          />
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] text-muted-foreground font-semibold pl-0.5">+{dayEvents.length - 2}</div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/40">
              {Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
                  {type}
                </div>
              ))}
            </div>

            {/* Selected day events */}
            {selectedDay && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 pt-5 border-t border-border/40"
              >
                <h3 className="font-semibold text-sm mb-3">{format(selectedDay, "MMMM d, yyyy")}</h3>
                {selectedDayEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events scheduled for this day.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayEvents.map(ev => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)}
                        className="w-full text-left p-3 rounded-xl border border-border/50 bg-background hover:border-primary/40 hover:bg-primary/5 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn("w-2 h-2 rounded-full shrink-0", EVENT_TYPE_COLORS[ev.type] ?? "bg-primary")} />
                          <span className="font-semibold text-sm">{ev.title}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{ev.type}</span>
                        </div>
                        {selectedEvent?.id === ev.id && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 space-y-1 text-xs text-muted-foreground pl-4">
                            <p><span className="font-semibold text-foreground">Provider:</span> {ev.provider}</p>
                            <p><span className="font-semibold text-foreground">Frequency:</span> {ev.frequency}</p>
                            {ev.notes && <p><span className="font-semibold text-foreground">Notes:</span> {ev.notes}</p>}
                            {ev.clinicalReference && (
                              <p className="italic text-[11px]">{ev.clinicalReference}</p>
                            )}
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Risk profile */}
            <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-sm">Risk Profile</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cancer Type</span>
                  <span className="text-sm font-semibold">{plan.cancerTypeName ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Risk Level</span>
                  <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border",
                    plan.riskCategory === "High"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-green-50 text-green-700 border-green-200"
                  )}>
                    {plan.riskCategory}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-xs font-semibold text-right max-w-[55%]">{plan.eligibilityStatus}</span>
                </div>
              </div>
              {plan.logicRationale && (
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/40 leading-relaxed">
                  {plan.logicRationale}
                </p>
              )}
            </div>

            {/* Upcoming events */}
            <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-sm">Upcoming Events</h3>
              </div>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming events.</p>
              ) : (
                <div className="space-y-2.5">
                  {upcomingEvents.map(ev => (
                    <div key={ev.id} className="flex items-start gap-2.5">
                      <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", EVENT_TYPE_COLORS[ev.type] ?? "bg-primary")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">{ev.title}</p>
                        {ev.recommendedStartDate && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(parseISO(ev.recommendedStartDate), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Required actions */}
            {plan.actions && plan.actions.length > 0 && (
              <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  <h3 className="font-display font-semibold text-sm">Required Actions</h3>
                </div>
                <div className="space-y-2">
                  {plan.actions.map(action => (
                    <div
                      key={action.id}
                      className={cn("p-3 rounded-xl border text-xs font-medium", URGENCY_COLORS[action.urgency] ?? "border-border bg-muted text-foreground")}
                    >
                      {action.action}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Health Tracker CTA */}
            <Link href="/health-tracker">
              <div className="bg-gradient-to-br from-primary/5 to-teal-500/5 border border-primary/20 rounded-2xl p-5 cursor-pointer hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm text-primary">Health Tracker</h3>
                </div>
                <p className="text-xs text-muted-foreground">Log completed tests and track your prevention journey.</p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
