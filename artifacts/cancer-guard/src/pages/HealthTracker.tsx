import { useState } from "react";
import { useListHealthLogs, useCreateHealthLog, HealthLogType } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { format } from "date-fns";
import { Plus, Calendar as CalendarIcon, Pill, Activity, Stethoscope, FileText, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HealthTracker() {
  const sessionId = getSessionId();
  const { data: logs, isLoading, refetch } = useListHealthLogs({ sessionId });
  const mutation = useCreateHealthLog();
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    logType: 'note' as HealthLogType,
    title: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const getIconForType = (type: string) => {
    switch(type) {
      case 'medication': return <Pill className="w-4 h-4" />;
      case 'appointment': return <Stethoscope className="w-4 h-4" />;
      case 'screening': return <Activity className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      data: { sessionId, ...formData }
    }, {
      onSuccess: () => {
        setIsAdding(false);
        setFormData({ logType: 'note', title: '', date: new Date().toISOString().split('T')[0], description: '' });
        refetch();
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Health Tracker</h1>
          <p className="text-muted-foreground mt-1">Log symptoms, appointments, and lifestyle changes.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="gap-2">
          {isAdding ? "Cancel" : <><Plus className="w-4 h-4" /> Add Entry</>}
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/20 shadow-md shadow-primary/5">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Entry Type</label>
                      <div className="relative">
                        <select 
                          value={formData.logType}
                          onChange={e => setFormData(prev => ({...prev, logType: e.target.value as HealthLogType}))}
                          className="w-full p-3 rounded-xl border border-border bg-card appearance-none pr-10 focus:ring-2 focus:ring-primary outline-none"
                        >
                          {Object.values(HealthLogType).map(t => (
                            <option key={t} value={t} className="capitalize">{t}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-semibold">Date</label>
                      <input 
                        type="date" 
                        required
                        value={formData.date}
                        onChange={e => setFormData(prev => ({...prev, date: e.target.value}))}
                        className="w-full p-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., Annual Mammogram, Started new vitamins..."
                      value={formData.title}
                      onChange={e => setFormData(prev => ({...prev, title: e.target.value}))}
                      className="w-full p-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Notes (Optional)</label>
                    <textarea 
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}
                      className="w-full p-3 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none resize-none"
                    />
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? "Saving..." : "Save Entry"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : logs && logs.length > 0 ? (
          <div className="relative border-l-2 border-border/60 ml-4 pl-6 space-y-8 pb-8">
            {logs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log) => (
              <div key={log.id} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-primary ring-4 ring-background" />
                
                <Card className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <h3 className="font-display font-semibold text-lg text-foreground">{log.title}</h3>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary/50 text-secondary-foreground rounded-md capitalize font-medium">
                          {getIconForType(log.logType)}
                          {log.logType}
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <CalendarIcon className="w-4 h-4" />
                          {format(new Date(log.date), 'MMMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    {log.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed bg-slate-50 p-3 rounded-lg border border-border/50">
                        {log.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-3xl border border-border border-dashed">
            <FileText className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold">No entries yet</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Start tracking your symptoms, appointments, and lifestyle changes to keep a comprehensive health record.</p>
          </div>
        )}
      </div>
    </div>
  );
}
