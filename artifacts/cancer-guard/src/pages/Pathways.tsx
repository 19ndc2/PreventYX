import { useListPreventionPathways } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ShieldCheck, Calendar, Activity, AlertCircle } from "lucide-react";
import { getRiskColor, cn } from "@/lib/utils";

export default function Pathways() {
  const { data: pathways, isLoading } = useListPreventionPathways();

  if (isLoading) {
    return <div className="animate-pulse space-y-6">
      {[1,2].map(i => <div key={i} className="h-48 bg-muted rounded-2xl" />)}
    </div>;
  }

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground">Prevention Pathways</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Actionable, step-by-step guidance to minimize your risk and stay healthy.
        </p>
      </header>

      <div className="space-y-6">
        {pathways?.map((pathway) => (
          <Card key={pathway.id} className="overflow-hidden border-border/60">
            <div className={cn("h-2 w-full", pathway.priority > 5 ? "bg-accent" : "bg-primary")} />
            <CardHeader className="bg-secondary/10 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <ShieldCheck className={cn("w-6 h-6", pathway.priority > 5 ? "text-accent" : "text-primary")} />
                  <CardTitle className="text-2xl">{pathway.title}</CardTitle>
                </div>
                <span className={cn("px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider", getRiskColor(pathway.riskLevel))}>
                  {pathway.riskLevel.replace('_', ' ')} Risk Level
                </span>
              </div>
              <p className="text-foreground font-medium">{pathway.cancerTypeName} Cancer Prevention</p>
            </CardHeader>

            <CardContent className="pt-6 space-y-8">
              <p className="text-muted-foreground leading-relaxed">{pathway.description}</p>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="flex items-center gap-2 font-display font-semibold text-lg mb-4">
                    <Activity className="w-5 h-5 text-primary" /> Action Items
                  </h4>
                  <div className="space-y-4">
                    {pathway.actions.map(action => (
                      <div key={action.id} className="relative pl-6">
                        <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-primary" />
                        <h5 className="font-semibold text-foreground mb-1">{action.title}</h5>
                        <p className="text-sm text-muted-foreground mb-2">{action.description}</p>
                        <div className="flex items-center gap-4 text-xs font-medium text-foreground/80">
                          <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                            <Calendar className="w-3 h-3" /> {action.frequency}
                          </span>
                          {action.urgent && (
                            <span className="flex items-center gap-1 text-destructive">
                              <AlertCircle className="w-3 h-3" /> Urgent
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 h-fit">
                  <h4 className="font-display font-semibold text-lg mb-4">Lifestyle Adjustments</h4>
                  <ul className="space-y-3">
                    {pathway.lifestyleChanges.map((change, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <div className="w-5 h-5 rounded-full bg-white border border-border flex items-center justify-center shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        </div>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {pathways?.length === 0 && (
          <div className="text-center py-20 bg-card rounded-3xl border border-border">
             <ShieldCheck className="w-16 h-16 text-muted mx-auto mb-4" />
             <h3 className="text-xl font-display font-bold">No pathways generated yet</h3>
             <p className="text-muted-foreground mt-2">Complete a risk assessment to get personalized recommendations.</p>
          </div>
        )}
      </div>
    </div>
  );
}
