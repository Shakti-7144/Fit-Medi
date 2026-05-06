import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Stethoscope, Loader2, Sparkles } from "lucide-react";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { toast } from "sonner";

const Symptoms = () => {
  const [symptoms, setSymptoms] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (symptoms.trim().length < 5) return toast.error("Please describe your symptoms");
    setLoading(true); setAnalysis("");
    try {
      const { data, error } = await supabase.functions.invoke("analyze-symptoms", { body: { symptoms } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div>
        <p className="text-sm text-primary font-medium">AI Insight</p>
        <h1 className="font-display text-4xl md:text-5xl text-foreground mt-1">Symptom analysis</h1>
        <p className="mt-2 text-muted-foreground">We compare your current symptoms against your past records.</p>
      </div>

      <Card className="mt-6 p-6 border-0 shadow-soft rounded-3xl">
        <label className="text-sm font-medium flex items-center gap-2"><Stethoscope className="h-4 w-4 text-primary" />Describe what you're feeling</label>
        <Textarea className="mt-3 rounded-xl min-h-32" placeholder="e.g. Persistent headache for 3 days, mild nausea in the morning…" value={symptoms} onChange={e => setSymptoms(e.target.value)} />
        <Button disabled={loading} onClick={run} className="mt-4 gradient-coral text-white rounded-2xl h-12 px-6 shadow-coral">
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing…</> : <><Sparkles className="h-4 w-4 mr-2" />Analyze</>}
        </Button>
      </Card>

      {analysis && (
        <Card className="mt-6 p-6 border-0 shadow-soft rounded-3xl bg-gradient-to-br from-secondary/40 to-background">
          <h3 className="font-display text-2xl">AI analysis</h3>
          <div className="mt-3 whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">{analysis}</div>
        </Card>
      )}

      <MedicalDisclaimer className="mt-6" />
    </div>
  );
};

export default Symptoms;
