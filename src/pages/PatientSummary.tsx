import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, FileHeart, Stethoscope, User } from "lucide-react";
import { format } from "date-fns";

type Profile = { id: string; name: string | null; email: string | null; age: number | null; gender: string | null; phone: string | null };
type Sym = { id: string; symptoms: string; ai_analysis: string | null; created_at: string };
type Rec = { id: string; file_name: string; ai_summary: string | null; upload_date: string };

const PatientSummary = () => {
  const { patientId = "" } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [syms, setSyms] = useState<Sym[]>([]);
  const [recs, setRecs] = useState<Rec[]>([]);

  useEffect(() => {
    (async () => {
      const [p, s, r] = await Promise.all([
        supabase.from("profiles").select("id, name, email, age, gender, phone").eq("id", patientId).maybeSingle(),
        supabase.from("symptom_analyses").select("*").eq("user_id", patientId).order("created_at", { ascending: false }),
        supabase.from("medical_records").select("id, file_name, ai_summary, upload_date").eq("user_id", patientId).order("upload_date", { ascending: false }),
      ]);
      setProfile(p.data as Profile);
      setSyms((s.data as Sym[]) || []);
      setRecs((r.data as Rec[]) || []);
      setLoading(false);
    })();
  }, [patientId]);

  if (loading) return <div className="grid place-items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <Button variant="ghost" onClick={() => nav(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
      <Card className="p-6 border-0 shadow-soft rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary"><User className="h-6 w-6" /></div>
          <div>
            <h1 className="font-display text-3xl">{profile?.name || profile?.email || "Patient"}</h1>
            <p className="text-sm text-muted-foreground">
              {[profile?.age && `${profile.age}y`, profile?.gender, profile?.phone].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      </Card>

      <h2 className="font-display text-2xl mt-8 mb-3 flex items-center gap-2"><Stethoscope className="h-5 w-5 text-primary" />Symptoms</h2>
      <div className="space-y-3">
        {syms.length === 0 && <p className="text-sm text-muted-foreground">No symptom logs.</p>}
        {syms.map(s => (
          <Card key={s.id} className="p-5 border-0 shadow-soft rounded-2xl">
            <p className="text-xs text-muted-foreground">{format(new Date(s.created_at), "PPP · p")}</p>
            <p className="mt-1 font-medium">{s.symptoms}</p>
            {s.ai_analysis && <div className="mt-3 p-3 rounded-xl bg-muted/40 text-sm whitespace-pre-wrap">{s.ai_analysis}</div>}
          </Card>
        ))}
      </div>

      <h2 className="font-display text-2xl mt-8 mb-3 flex items-center gap-2"><FileHeart className="h-5 w-5 text-primary" />Medical record summaries</h2>
      <div className="space-y-3">
        {recs.length === 0 && <p className="text-sm text-muted-foreground">No medical records.</p>}
        {recs.map(r => (
          <Card key={r.id} className="p-5 border-0 shadow-soft rounded-2xl">
            <p className="text-xs text-muted-foreground">{format(new Date(r.upload_date), "PPP")}</p>
            <p className="mt-1 font-medium">{r.file_name}</p>
            {r.ai_summary && <div className="mt-3 p-3 rounded-xl bg-muted/40 text-sm whitespace-pre-wrap">{r.ai_summary}</div>}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PatientSummary;
