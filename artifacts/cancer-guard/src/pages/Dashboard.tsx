import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Activity, Calendar, HeartPulse, ChevronRight, AlertCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getSessionId, formatRiskScore, getRiskColor, cn } from "@/lib/utils";
import { useListRiskAssessments, useListHealthLogs } from "@workspace/api-client-react";
import { format } from "date-fns";

export default function Dashboard() {
  const sessionId = getSessionId();
  
  const { data: assessments, isLoading: isLoadingRisk } = useListRiskAssessments({ sessionId });
  const { data: logs, isLoading: isLoadingLogs } = useListHealthLogs({ sessionId });

  const latestAssessment = assessments?.[0];
  const recentLogs = logs?.slice(0, 3) || [];

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground">Welcome to Preventyx</h1>
        <p className="text-muted-foreground mt-2">Your personalized prevention and health tracking dashboard.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Assessment Summary */}
        <Card className="md:col-span-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
            <Activity className="w-48 h-48" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Risk Assessment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRisk ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ) : latestAssessment ? (
              <div>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-display font-bold text-foreground">
                    {latestAssessment.overallRiskScore.toFixed(0)}
                  </span>
                  <span className="text-muted-foreground font-medium">/ 100 Overall Risk Index</span>
                </div>
                
                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Key Risk Areas</h4>
                <div className="space-y-3 mb-6">
                  {latestAssessment.riskFactors.map(factor => (
                    <div key={factor.cancerTypeName} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-secondary">
                      <span className="font-medium">{factor.cancerTypeName}</span>
                      <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", getRiskColor(factor.riskLevel))}>
                        {factor.riskLevel.replace('_', ' ').toUpperCase()} ({formatRiskScore(factor.riskScore)})
                      </span>
                    </div>
                  ))}
                </div>
                
                <Link href="/risk-assessment">
                  <Button variant="outline" className="w-full sm:w-auto">Update Assessment</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">No Assessment Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Complete your first risk assessment to generate your personalized prevention pathways.</p>
                <Link href="/risk-assessment">
                  <Button>Start Risk Assessment</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & AI */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/5 to-teal-500/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <img 
                  src={`${import.meta.env.BASE_URL}images/ai-advisor.png`} 
                  alt="AI Advisor" 
                  className="w-16 h-16 rounded-2xl object-cover shadow-sm bg-white"
                />
                <div>
                  <h3 className="font-display font-bold text-lg mb-1">AI Advisor</h3>
                  <p className="text-sm text-muted-foreground mb-4">Ask questions about symptoms, screening, or prevention.</p>
                  <Link href="/chat">
                    <Button size="sm" className="w-full">Chat Now</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Recent Health Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}
                </div>
              ) : recentLogs.length > 0 ? (
                <div className="space-y-3">
                  {recentLogs.map(log => (
                    <div key={log.id} className="flex flex-col p-3 rounded-xl border border-border/50 bg-background/50 text-sm hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold truncate">{log.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{format(new Date(log.date), 'MMM d')}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground w-fit capitalize">
                        {log.logType}
                      </span>
                    </div>
                  ))}
                  <Link href="/health-tracker" className="block text-center text-sm font-medium text-primary mt-4 hover:underline">
                    View all logs
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No health logs recorded yet.
                  <Link href="/health-tracker" className="block text-primary font-medium mt-2 hover:underline">
                    Add entry
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recommended Pathways Preview */}
      {latestAssessment && latestAssessment.recommendedPathways.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">Recommended Pathways</h2>
            <Link href="/pathways" className="text-primary font-medium hover:underline flex items-center text-sm">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestAssessment.recommendedPathways.slice(0, 3).map(pathway => (
              <Card key={pathway.id} className="flex flex-col h-full hover:-translate-y-1 transition-transform duration-300 border-t-4 border-t-primary">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold text-primary">{pathway.cancerTypeName}</span>
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", getRiskColor(pathway.riskLevel))}>
                      {pathway.riskLevel.replace('_', ' ')}
                    </span>
                  </div>
                  <CardTitle className="text-lg leading-tight">{pathway.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{pathway.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{pathway.screeningFrequency}</span>
                    </div>
                  </div>
                </CardContent>
                <CardContent className="pt-0 border-t border-border/50 mt-auto flex flex-col justify-end">
                  <div className="pt-4">
                     <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Next Actions ({pathway.actions.length})</p>
                     <ul className="text-sm space-y-1">
                       {pathway.actions.slice(0, 2).map(action => (
                         <li key={action.id} className="flex items-start gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                           <span className="line-clamp-1">{action.title}</span>
                         </li>
                       ))}
                     </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
