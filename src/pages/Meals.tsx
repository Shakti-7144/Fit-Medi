import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Utensils, Plus, Camera, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Meal = { id: string; date: string; meal_name: string; meal_description: string | null; ai_nutrition: any };

const Meals = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState({ name: "", desc: "" });
  const [imageData, setImageData] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("meal_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);
    setMeals((data as Meal[]) || []); setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const onPickImage = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
    // Downscale for token efficiency
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const max = 1024;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale); const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        setImageData(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!form.name.trim() && !imageData) return toast.error("Add a meal name or photo");
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-meal", {
        body: { mealName: form.name, mealDescription: form.desc, imageBase64: imageData },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const finalName = form.name.trim() || data.nutrition?.detected_name || "Meal";
      const { error: insErr } = await supabase.from("meal_logs").insert({
        user_id: user!.id, meal_name: finalName, meal_description: form.desc, ai_nutrition: data.nutrition,
      });
      if (insErr) throw insErr;
      toast.success("Meal analyzed and saved");
      setForm({ name: "", desc: "" }); setImageData(null);
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (e: any) { toast.error(e.message || "Analysis failed"); }
    finally { setAnalyzing(false); }
  };

  const today = meals.filter(m => m.date === format(new Date(), "yyyy-MM-dd"));
  const totals = today.reduce((a, m) => {
    const n = m.ai_nutrition || {};
    return { cal: a.cal + (n.calories || 0), p: a.p + (n.protein_g || 0), c: a.c + (n.carbs_g || 0), f: a.f + (n.fats_g || 0) };
  }, { cal: 0, p: 0, c: 0, f: 0 });

  if (loading) return <div className="grid place-items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div>
        <p className="text-sm text-primary font-medium">Nutrition</p>
        <h1 className="font-display text-4xl md:text-5xl text-foreground mt-1">Meal log</h1>
        <p className="mt-2 text-muted-foreground">Snap a photo or describe a meal — AI estimates the nutrition.</p>
      </div>

      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        <Card className="p-6 border-0 shadow-soft rounded-3xl lg:col-span-2">
          <h3 className="font-display text-2xl flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" />Log a new meal</h3>

          {imageData ? (
            <div className="mt-4 relative inline-block">
              <img src={imageData} alt="Meal preview" className="max-h-56 rounded-2xl shadow-soft" />
              <button onClick={() => { setImageData(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="absolute -top-2 -right-2 grid h-8 w-8 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-elegant">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="mt-4 inline-flex items-center cursor-pointer rounded-2xl border-2 border-dashed border-primary/30 bg-secondary/30 px-5 py-3 text-sm font-medium text-primary hover:bg-secondary/60 transition">
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => e.target.files?.[0] && onPickImage(e.target.files[0])} />
              <Camera className="h-4 w-4 mr-2" />Add a photo (optional)
            </label>
          )}

          <div className="mt-4 space-y-4">
            <div><Label>Meal name {imageData && <span className="text-xs text-muted-foreground">(optional with photo)</span>}</Label>
              <Input className="mt-1.5 h-11 rounded-xl" placeholder="e.g. Grilled chicken bowl" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Description (optional)</Label>
              <Textarea className="mt-1.5 rounded-xl" placeholder="2 cups brown rice, 200g chicken, mixed greens, olive oil…" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} /></div>
            <Button disabled={analyzing} onClick={analyze} className="gradient-coral text-white rounded-2xl h-12 px-6 shadow-coral">
              {analyzing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing…</> : <><Plus className="h-4 w-4 mr-2" />Analyze with AI</>}
            </Button>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-soft rounded-3xl bg-gradient-to-br from-primary/5 to-primary-glow/10">
          <h3 className="font-display text-2xl">Today</h3>
          <div className="mt-4 space-y-3">
            <Stat label="Calories" value={totals.cal.toFixed(0)} unit="kcal" />
            <Stat label="Protein" value={totals.p.toFixed(0)} unit="g" />
            <Stat label="Carbs" value={totals.c.toFixed(0)} unit="g" />
            <Stat label="Fats" value={totals.f.toFixed(0)} unit="g" />
          </div>
        </Card>
      </div>

      <h3 className="font-display text-2xl mt-10 mb-4">History</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {meals.length === 0 && <p className="text-muted-foreground">No meals logged yet.</p>}
        {meals.map(m => {
          const n = m.ai_nutrition || {};
          return (
            <Card key={m.id} className="p-5 border-0 shadow-soft rounded-3xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2"><Utensils className="h-4 w-4 text-primary" /><div className="font-medium">{m.meal_name}</div></div>
                  {m.meal_description && <p className="text-xs text-muted-foreground mt-1">{m.meal_description}</p>}
                </div>
                {n.confidence && <Badge variant="secondary" className="rounded-full">{n.confidence}</Badge>}
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <Mini label="kcal" value={n.calories} />
                <Mini label="P" value={n.protein_g ? `${n.protein_g}g` : "-"} />
                <Mini label="C" value={n.carbs_g ? `${n.carbs_g}g` : "-"} />
                <Mini label="F" value={n.fats_g ? `${n.fats_g}g` : "-"} />
              </div>
              {n.suggestion && <p className="mt-3 text-xs text-muted-foreground italic">"{n.suggestion}"</p>}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const Stat = ({ label, value, unit }: { label: string; value: string; unit: string }) => (
  <div className="flex items-baseline justify-between border-b border-border/50 last:border-0 pb-2">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="font-display text-2xl text-foreground">{value}<span className="text-sm text-muted-foreground ml-1">{unit}</span></span>
  </div>
);
const Mini = ({ label, value }: { label: string; value: any }) => (
  <div className="rounded-xl bg-muted/50 py-2"><div className="text-xs text-muted-foreground">{label}</div><div className="font-medium text-sm">{value ?? "-"}</div></div>
);

export default Meals;
