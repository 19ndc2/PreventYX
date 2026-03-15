import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useListHealthLogs, useCreateHealthLog } from "@workspace/api-client-react";
import { getSessionId, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { format, parseISO } from "date-fns";
import {
  Plus,
  Calendar as CalendarIcon,
  Stethoscope,
  Activity,
  FileText,
  CheckCircle2,
  Clock,
  Star,
  X,
  ChevronDown,
  Lock,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CarePlanEvent {
  id: number;
  eventId: string;
  step: number | null;
  title: string;
  type: string;
  provider: string;
  frequency: string;
  recommendedStartDate: string | null;
  notes: string | null;
  prerequisiteEventId: string | null;
  clinicalReference: string | null;
}

type FeedbackRating = "great" | "okay" | "issues";

interface FeedbackModal {
  event: CarePlanEvent;
}

const RATING_OPTIONS: { value: FeedbackRating; label: string; emoji: string; color: string }[] = [
  { value: "great", label: "All good", emoji: "😊", color: "border-green-300 bg-green-50 hover:bg-green-100 text-green-700" },
  { value: "okay", label: "It was okay", emoji: "😐", color: "border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700" },
  { value: "issues", label: "Had issues", emoji: "😟", color: "border-red-300 bg-red-50 hover:bg-red-100 text-red-700" },
];

function fetchLatestCarePlan(sessionId: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const planId = localStorage.getItem("preventyx_care_plan_id");

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

export default function HealthTracker() {
  const sessionId = getSessionId();
  const { data: logs, isLoading: logsLoading, refetch } = useListHealthLogs({ sessionId });
  const createLog = useCreateHealthLog();

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ["care-plan-tracker", sessionId],
    queryFn: () => fetchLatestCarePlan(sessionId),
    staleTime: 60_000,
  });

  const [feedbackModal, setFeedbackModal] = useState<FeedbackModal | null>(null);
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    logType: "screening" as const,
    title: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const completedEventIds = new Set(
    (logs ?? [])
      .filter(l => l.description?.startsWith("care_plan_event:"))
      .map(l => l.description!.split("\n")[0].split("care_plan_event:")[1])
  );

  const events: CarePlanEvent[] = plan?.events ?? [];

  const openFeedback = (event: CarePlanEvent) => {
    setFeedbackModal({ event });
    setRating(null);
    setNotes("");
  };

  const submitFeedback = async () => {
    if (!feedbackModal || !rating) return;
    setSubmitting(true);

    createLog.mutate({
      data: {
        sessionId,
        logType: "screening",
        title: `Completed: ${feedbackModal.event.title}`,
        date: new Date().toISOString().split("T")[0],
        description: `care_plan_event:${feedbackModal.event.eventId}\nRating: ${rating}\n${notes ? "Notes: " + notes : ""}`,
      }
    }, {
      onSuccess: () => {
        refetch();
        setFeedbackModal(null);
        setSubmitting(false);
      },
      onError: () => setSubmitting(false),
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLog.mutate({
      data: { sessionId, ...manualForm }
    }, {
      onSuccess: () => {
        setIsAddingManual(false);
        setManualForm({ logType: "screening", title: "", date: new Date().toISOString().split("T")[0], description: "" });
        refetch();
      }
    });
  };

  const visibleLogs = (logs ?? []).filter(l => !l.description?.startsWith("care_plan_event:"));
  const completionLogs = (logs ?? []).filter(l => l.description?.startsWith("care_plan_event:"));

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Health Tracker</h1>
          <p className="text-muted-foreground mt-1 text-sm">Mark tests as done and log health events.</p>
        </div>
        <Button onClick={() => setIsAddingManual(!isAddingManual)} variant="outline" className="gap-2">
          {isAddingManual ? "Cancel" : <><Plus className="w-4 h-4" /> Add Entry</>}
        </Button>
      </div>

      {/* Manual entry form */}
      <AnimatePresence>
        {isAddingManual && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-sm">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Date</label>
                    <input
                      type="date"
                      required
                      value={manualForm.date}
                      onChange={e => setManualForm(p => ({ ...p, date: e.target.value }))}
                      className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Type</label>
                    <div className="relative">
                      <select
                        value={manualForm.logType}
                        onChange={e => setManualForm(p => ({ ...p, logType: e.target.value as any }))}
                        className="w-full p-3 rounded-xl border border-border bg-background appearance-none pr-10 focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="screening">Screening</option>
                        <option value="appointment">Appointment</option>
                        <option value="medication">Medication</option>
                        <option value="note">Note</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Annual Mammogram, Blood test…"
                    value={manualForm.title}
                    onChange={e => setManualForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Notes (optional)</label>
                  <textarea
                    rows={2}
                    value={manualForm.description}
                    onChange={e => setManualForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none resize-none"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={createLog.isPending}>
                    {createLog.isPending ? "Saving…" : "Save Entry"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Care plan events — mark as done */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Your Care Plan Steps
          </h2>
          {events.length > 0 && (
            <span className="text-xs text-muted-foreground font-medium bg-secondary px-2.5 py-1 rounded-lg">
              {completedEventIds.size} / {events.length} completed
            </span>
          )}
        </div>

        {planLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-10 bg-card rounded-2xl border border-dashed border-border">
            <Clock className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No care plan yet. Get your personalized plan from the home page.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-5 top-10 bottom-10 w-px bg-border/60 z-0" />

            <div className="space-y-3 relative z-10">
              {events
                .slice()
                .sort((a, b) => (a.step ?? 99) - (b.step ?? 99))
                .map((ev, idx) => {
                  const isDone = completedEventIds.has(ev.eventId);
                  const prereqDone = !ev.prerequisiteEventId || completedEventIds.has(ev.prerequisiteEventId);
                  const isLocked = !prereqDone && !isDone;
                  const prereqEvent = ev.prerequisiteEventId
                    ? events.find(e => e.eventId === ev.prerequisiteEventId)
                    : null;

                  return (
                    <div key={ev.id} className="flex gap-3">
                      {/* Step indicator */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold text-sm z-10 bg-background",
                          isDone
                            ? "border-green-500 bg-green-50 text-green-600"
                            : isLocked
                              ? "border-border bg-muted text-muted-foreground"
                              : "border-primary bg-primary/10 text-primary"
                        )}>
                          {isDone
                            ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                            : isLocked
                              ? <Lock className="w-4 h-4" />
                              : <span>{ev.step ?? idx + 1}</span>
                          }
                        </div>
                      </div>

                      {/* Card */}
                      <div className={cn(
                        "flex-1 rounded-2xl border p-4 transition-all mb-1",
                        isDone
                          ? "bg-green-50/40 border-green-200/60"
                          : isLocked
                            ? "bg-muted/40 border-border/40 opacity-70"
                            : "bg-card border-border/50 hover:border-primary/30 shadow-sm"
                      )}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Step {ev.step ?? idx + 1}
                              </span>
                              <span className={cn(
                                "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                                ev.type === "Consultation"
                                  ? "bg-blue-100 text-blue-700"
                                  : ev.type === "Screening"
                                    ? "bg-teal-100 text-teal-700"
                                    : ev.type === "Diagnostic"
                                      ? "bg-purple-100 text-purple-700"
                                      : ev.type === "Genetic Testing"
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-secondary text-secondary-foreground"
                              )}>
                                {ev.type}
                              </span>
                              {ev.isRecurring && (
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                  <RefreshCw className="w-2.5 h-2.5" />
                                  Recurring
                                </span>
                              )}
                            </div>
                            <p className={cn(
                              "font-semibold text-sm leading-snug",
                              isDone && "line-through text-muted-foreground",
                              isLocked && "text-muted-foreground"
                            )}>
                              {ev.title}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                              <span className="text-xs text-muted-foreground">{ev.provider}</span>
                              {ev.frequency && (
                                <span className="text-xs font-semibold text-primary/80 flex items-center gap-1">
                                  <RefreshCw className="w-2.5 h-2.5" />
                                  {ev.frequency}
                                </span>
                              )}
                              {ev.recommendedStartDate && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <CalendarIcon className="w-2.5 h-2.5" />
                                  {format(parseISO(ev.recommendedStartDate), "MMM d, yyyy")}
                                </span>
                              )}
                            </div>
                            {/* Prerequisite notice */}
                            {isLocked && prereqEvent && (
                              <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                                <Lock className="w-3 h-3 shrink-0" />
                                <span>Complete <strong>Step {prereqEvent.step ?? ""}: {prereqEvent.title}</strong> first</span>
                              </div>
                            )}
                            {/* Notes */}
                            {ev.notes && !isLocked && (
                              <p className="text-xs text-muted-foreground mt-1.5 italic leading-relaxed">{ev.notes}</p>
                            )}
                            {/* Clinical reference */}
                            {ev.clinicalReference && !isLocked && (
                              <p className="text-[10px] text-muted-foreground/70 mt-1">📋 {ev.clinicalReference}</p>
                            )}
                          </div>

                          <div className="shrink-0">
                            {isDone ? (
                              <span className="px-3 py-1.5 rounded-xl bg-green-100 text-green-700 font-semibold text-xs whitespace-nowrap">
                                Done ✓
                              </span>
                            ) : isLocked ? (
                              <span className="px-3 py-1.5 rounded-xl bg-muted text-muted-foreground font-semibold text-xs whitespace-nowrap">
                                Locked
                              </span>
                            ) : (
                              <button
                                onClick={() => openFeedback(ev)}
                                className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-semibold text-xs hover:bg-primary hover:text-white transition-all whitespace-nowrap"
                              >
                                Mark Done
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Completed tests history */}
      {completionLogs.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Completed Tests
          </h2>
          <div className="relative border-l-2 border-border/60 ml-4 pl-6 space-y-6">
            {completionLogs.map(log => {
              const lines = (log.description ?? "").split("\n").filter(l => !l.startsWith("care_plan_event:"));
              const ratingLine = lines.find(l => l.startsWith("Rating:"))?.replace("Rating: ", "") as FeedbackRating | undefined;
              const notesLine = lines.find(l => l.startsWith("Notes:"))?.replace("Notes: ", "");
              return (
                <div key={log.id} className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-green-500 ring-4 ring-background" />
                  <div className="bg-card border border-border/50 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm">{log.title}</p>
                      <span className="text-xs text-muted-foreground">{format(new Date(log.date), "MMM d, yyyy")}</span>
                    </div>
                    {ratingLine && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs font-medium text-muted-foreground">Feedback:</span>
                        <span className="text-xs font-semibold capitalize">{ratingLine}</span>
                        {ratingLine === "great" && <span>😊</span>}
                        {ratingLine === "okay" && <span>😐</span>}
                        {ratingLine === "issues" && <span>😟</span>}
                      </div>
                    )}
                    {notesLine && <p className="text-xs text-muted-foreground mt-1 italic">{notesLine}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual health log history */}
      {!logsLoading && visibleLogs.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-base mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Health Log
          </h2>
          <div className="relative border-l-2 border-border/60 ml-4 pl-6 space-y-6 pb-4">
            {visibleLogs
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(log => (
                <div key={log.id} className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-primary ring-4 ring-background" />
                  <div className="bg-card border border-border/50 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm">{log.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize bg-secondary/50 px-2 py-0.5 rounded-md font-medium">{log.logType}</span>
                        <span>{format(new Date(log.date), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                    {log.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1 bg-slate-50 p-2 rounded-lg border border-border/40">
                        {log.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setFeedbackModal(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="font-display font-bold text-lg">Test Completed!</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{feedbackModal.event.title}</p>
                </div>
                <button
                  onClick={() => setFeedbackModal(null)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm font-semibold mb-3">How did it go?</p>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {RATING_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRating(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-semibold transition-all",
                      rating === opt.value
                        ? opt.color + " border-current scale-105 shadow-sm"
                        : "border-border hover:border-primary/30 hover:bg-muted/50"
                    )}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 mb-5">
                <label className="text-sm font-semibold">Any notes? (optional)</label>
                <textarea
                  rows={3}
                  placeholder="How did you feel? Any follow-up needed?"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border bg-slate-50 focus:ring-2 focus:ring-primary outline-none resize-none text-sm"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={submitFeedback}
                  disabled={!rating || submitting}
                  className="flex-1"
                >
                  {submitting ? "Saving…" : "Save Feedback"}
                </Button>
                <Button variant="outline" onClick={() => setFeedbackModal(null)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
