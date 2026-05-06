import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload, FileText, Trash2, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { format } from "date-fns";

type Rec = { id: string; file_path: string; file_name: string; file_type: string | null; ai_summary: string | null; upload_date: string };

const HealthRecords = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [summarizing, setSummarizing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Rec | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("medical_records").select("*").eq("user_id", user.id).order("upload_date", { ascending: false });
    setRecords((data as Rec[]) || []); setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const upload = async (file: File) => {
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) return toast.error("Max 10MB");
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("medical-records").upload(path, file);
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("medical_records").insert({ user_id: user.id, file_path: path, file_name: file.name, file_type: file.type });
      if (insErr) throw insErr;
      toast.success("Uploaded");
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const summarize = async (id: string) => {
    setSummarizing(id);
    try {
      const { data, error } = await supabase.functions.invoke("summarize-record", { body: { recordId: id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Summary generated");
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSummarizing(null); }
  };

  const remove = async (rec: Rec) => {
    await supabase.storage.from("medical-records").remove([rec.file_path]);
    await supabase.from("medical_records").delete().eq("id", rec.id);
    toast.success("Deleted"); load();
  };

  const view = async (rec: Rec) => {
    const { data } = await supabase.storage.from("medical-records").createSignedUrl(rec.file_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  if (loading) return <div className="grid place-items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div>
        <p className="text-sm text-accent font-medium">Health Records</p>
        <h1 className="font-display text-4xl md:text-5xl text-foreground mt-1">Your medical files</h1>
        <p className="mt-2 text-muted-foreground">Upload prescriptions, lab reports, and scans. AI can summarize them.</p>
      </div>

      <Card className="mt-6 p-8 border-0 shadow-soft rounded-3xl border-2 border-dashed border-primary/20 bg-secondary/30 text-center">
        <Upload className="h-10 w-10 mx-auto text-primary" />
        <h3 className="font-display text-2xl mt-4">Upload a record</h3>
        <p className="text-sm text-muted-foreground mt-1">PDF, image, or document · up to 10MB</p>
        <label className="inline-block mt-5">
          <input type="file" className="hidden" accept=".pdf,image/*,.doc,.docx" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
          <span className="inline-flex items-center justify-center cursor-pointer gradient-hero text-primary-foreground rounded-2xl h-12 px-6 shadow-elegant text-sm font-medium">
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Choose file
          </span>
        </label>
      </Card>

      <MedicalDisclaimer className="mt-6" />

      <div className="mt-8 space-y-3">
        {records.length === 0 && <p className="text-muted-foreground text-center py-12">No records yet.</p>}
        {records.map(r => (
          <Card key={r.id} className="p-5 border-0 shadow-soft rounded-2xl">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary"><FileText className="h-5 w-5" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.file_name}</div>
                <div className="text-xs text-muted-foreground">{format(new Date(r.upload_date), "PPP")}</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => view(r)}><Eye className="h-4 w-4 mr-1" />View</Button>
                {!r.ai_summary ? (
                  <Button size="sm" disabled={summarizing === r.id} onClick={() => summarize(r.id)} className="gradient-coral text-white rounded-xl">
                    {summarizing === r.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}AI summary
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" className="rounded-xl" onClick={() => setViewing(r)}>Read summary</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => remove(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
            {viewing?.id === r.id && r.ai_summary && (
              <div className="mt-4 p-4 rounded-xl bg-muted/50 whitespace-pre-wrap text-sm text-foreground/90">{r.ai_summary}</div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HealthRecords;
