import { useState } from "react";
import { useListCancerTypes } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Search, AlertTriangle, Info, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function CancerTypes() {
  const { data: cancerTypes, isLoading } = useListCancerTypes();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTypes = cancerTypes?.filter(ct => 
    ct.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ct.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 pb-12">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-display font-bold text-foreground">Cancer Library</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Evidence-based information on common cancer types in Canada, their risk factors, and early warning signs.
        </p>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search cancer types or symptoms..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-border/50 bg-card text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
        />
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse h-64 bg-muted/50 border-none" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredTypes.map((cancer, index) => (
            <motion.div
              key={cancer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full flex flex-col group overflow-hidden">
                <CardHeader className="bg-secondary/30 border-b border-border/50 pb-4 group-hover:bg-secondary/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl mb-1">{cancer.name} Cancer</CardTitle>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white text-xs font-medium text-muted-foreground border border-border">
                        <Info className="w-3 h-3" />
                        Incidence: {cancer.canadianIncidenceRate}/100k
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6 flex-1 flex flex-col">
                  <p className="text-foreground leading-relaxed mb-6 flex-1">
                    {cancer.description}
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-6 mt-auto">
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-accent mb-3">
                        <AlertTriangle className="w-4 h-4" /> Risk Factors
                      </h4>
                      <ul className="space-y-2">
                        {cancer.commonRiskFactors.slice(0, 4).map((factor, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent/50 mt-1.5 shrink-0" />
                            <span className="leading-snug">{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary mb-3">
                        <Info className="w-4 h-4" /> Early Signs
                      </h4>
                      <ul className="space-y-2">
                        {cancer.earlySymptoms.slice(0, 4).map((symptom, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 shrink-0" />
                            <span className="leading-snug">{symptom}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                    <span className="text-sm font-medium">Standard Screening Age: <strong className="text-foreground">{cancer.screeningAge}+</strong></span>
                    <button className="text-primary hover:text-primary-foreground hover:bg-primary p-2 rounded-full transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          {filteredTypes.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No cancer types found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
