import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateRiskAssessment, type CreateRiskAssessmentRequestSex } from "@workspace/api-client-react";
import { getSessionId } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Activity, ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RiskAssessment() {
  const [, setLocation] = useLocation();
  const sessionId = getSessionId();
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    age: 45,
    sex: "male" as CreateRiskAssessmentRequestSex,
    province: "Ontario",
    smokingStatus: "never",
    physicalActivity: "moderate",
    familyHistory: [] as string[],
    existingConditions: [] as string[]
  });

  const mutation = useCreateRiskAssessment({
    mutation: {
      onSuccess: () => {
        setLocation("/dashboard");
      }
    }
  });

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));
  
  const handleSubmit = () => {
    mutation.mutate({
      data: {
        sessionId,
        ...formData,
        // @ts-ignore mapping simple strings back to enum types for simplicity in this UI
        smokingStatus: formData.smokingStatus,
        physicalActivity: formData.physicalActivity
      }
    });
  };

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: 'familyHistory' | 'existingConditions', item: string) => {
    setFormData(prev => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
      };
    });
  };

  const steps = [
    { title: "Basic Info", desc: "Let's start with the basics" },
    { title: "Lifestyle", desc: "Daily habits matter" },
    { title: "History", desc: "Genetics & conditions" },
    { title: "Review", desc: "Ready to analyze" }
  ];

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-12">
        <h1 className="text-3xl font-display font-bold mb-6">Health Risk Assessment</h1>
        
        {/* Progress Bar */}
        <div className="flex justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 z-0 rounded-full" />
          <div 
            className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          />
          
          {steps.map((s, i) => {
            const isActive = step === i + 1;
            const isPast = step > i + 1;
            return (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-colors duration-300 ${
                  isActive ? "bg-primary border-white text-white shadow-lg shadow-primary/30" : 
                  isPast ? "bg-primary border-primary text-white" : "bg-card border-muted text-muted-foreground"
                }`}>
                  {isPast ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`absolute top-12 text-xs font-semibold whitespace-nowrap ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="min-h-[400px] border-border/60 shadow-xl shadow-black/5 bg-white/50 backdrop-blur-xl">
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-display font-bold">{steps[step-1].title}</h2>
                <p className="text-muted-foreground">{steps[step-1].desc}</p>
              </div>

              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Age</label>
                    <input 
                      type="range" min="18" max="100" 
                      value={formData.age}
                      onChange={(e) => updateForm('age', parseInt(e.target.value))}
                      className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-center mt-4 text-3xl font-display font-bold text-primary">{formData.age} <span className="text-lg text-muted-foreground font-medium">years old</span></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Biological Sex</label>
                      <select 
                        value={formData.sex}
                        onChange={(e) => updateForm('sex', e.target.value)}
                        className="w-full p-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Province</label>
                      <select 
                        value={formData.province}
                        onChange={(e) => updateForm('province', e.target.value)}
                        className="w-full p-4 rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary outline-none"
                      >
                        {["Ontario", "BC", "Alberta", "Quebec", "Nova Scotia"].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-3">Smoking Status</label>
                    <div className="grid grid-cols-3 gap-3">
                      {["never", "former", "current"].map(status => (
                        <button
                          key={status}
                          onClick={() => updateForm('smokingStatus', status)}
                          className={`p-4 rounded-xl border-2 transition-all capitalize font-medium ${
                            formData.smokingStatus === status 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-border hover:border-border/80 text-muted-foreground"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3">Physical Activity Level</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {["sedentary", "light", "moderate", "active"].map(level => (
                        <button
                          key={level}
                          onClick={() => updateForm('physicalActivity', level)}
                          className={`p-3 rounded-xl border-2 transition-all capitalize font-medium text-sm ${
                            formData.physicalActivity === level 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-border hover:border-border/80 text-muted-foreground"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-semibold mb-3">Immediate Family History of Cancer</label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Breast", "Colorectal", "Lung", "Prostate", "Melanoma", "Ovarian"].map(cancer => {
                        const selected = formData.familyHistory.includes(cancer);
                        return (
                          <button
                            key={cancer}
                            onClick={() => toggleArrayItem('familyHistory', cancer)}
                            className={`p-3 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                              selected 
                                ? "border-primary bg-primary/5 text-primary" 
                                : "border-border hover:border-border/80 text-foreground"
                            }`}
                          >
                            <span className="font-medium">{cancer}</span>
                            {selected && <CheckCircle2 className="w-5 h-5" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="bg-secondary/20 rounded-2xl p-6 border border-secondary">
                    <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-4">
                      <Activity className="w-5 h-5 text-primary" /> Ready for Analysis
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      By submitting this assessment, our AI will analyze your inputs against current Canadian guidelines to generate your personalized risk profile and prevention pathways.
                    </p>
                    
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <dt className="text-muted-foreground">Age/Sex</dt>
                      <dd className="font-medium text-right">{formData.age}, {formData.sex}</dd>
                      <dt className="text-muted-foreground">Smoking</dt>
                      <dd className="font-medium text-right capitalize">{formData.smokingStatus}</dd>
                      <dt className="text-muted-foreground">Family History</dt>
                      <dd className="font-medium text-right">{formData.familyHistory.length || "None"} reported</dd>
                    </dl>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex justify-between items-center pt-6 border-t border-border/50">
            <Button 
              variant="ghost" 
              onClick={handlePrev} 
              disabled={step === 1 || mutation.isPending}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            
            {step < 4 ? (
              <Button onClick={handleNext} className="gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={mutation.isPending}
                className="gap-2 min-w-[160px]"
              >
                {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze Risk"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
