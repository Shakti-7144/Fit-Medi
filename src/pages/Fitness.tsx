import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Footprints, Flame, Clock, TrendingUp, Plus, Loader2 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { format, subDays } from "date-fns";

type Log = { id: string; date: string; steps: number; calories_burned: number; workout_type: string | null; workout_duration: number };

const Fitness = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ steps: "", calories: "", duration: "", type: "Walking" });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("fitness_logs").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(30);
    setLogs((data as Log[]) || []); setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const add = async () => {
    if (!user) return;
    const { error } = await supabase.from("fitness_logs").insert({
      user_id: user.id,
      steps: parseInt(form.steps) || 0,
      calories_burned: parseFloat(form.calories) || 0,
      workout_duration: parseInt(form.duration) || 0,
      workout_type: form.type,
    });
    if (error) return toast.error(error.message);
    toast.success("Workout logged");
    setForm({ steps: "", calories: "", duration: "", type: "Walking" });
    setOpen(false); load();
  };

  const today = logs.find(l => l.date === format(new Date(), "yyyy-MM-dd"));
  const weekTotals = logs.slice(0, 7).reduce((a, l) => ({ steps: a.steps + l.steps, cal: a.cal + Number(l.calories_burned), min: a.min + l.workout_duration }), { steps: 0, cal: 0, min: 0 });

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    const log = logs.find(l => l.date === d);
    return { day: format(subDays(new Date(), 6 - i), "EEE"), steps: log?.steps || 0, cal: Number(log?.calories_burned || 0) };
  });

  if (loading) return <div className="grid place-items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-primary font-medium">Fitness</p>
          <h1 className="font-display text-4xl md:text-5xl text-foreground mt-1">Today's movement</h1>
        </div>
        <Button onClick={() => setOpen(!open)} className="gradient-hero text-primary-foreground rounded-2xl h-12 px-6 shadow-elegant"><Plus className="h-4 w-4 mr-2" />Log workout</Button>
      </div>

      {open && (
        <Card className="mt-6 p-6 border-0 shadow-soft rounded-3xl">
          <div className="grid md:grid-cols-4 gap-4">
            <div><Label>Steps</Label><Input className="mt-1.5 h-11 rounded-xl" value={form.steps} onChange={e => setForm({ ...form, steps: e.target.value })} type="number" /></div>
            <div><Label>Calories burned</Label><Input className="mt-1.5 h-11 rounded-xl" value={form.calories} onChange={e => setForm({ ...form, calories: e.target.value })} type="number" /></div>
            <div><Label>Duration (min)</Label><Input className="mt-1.5 h-11 rounded-xl" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} type="number" /></div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{["Walking", "Running", "Cycling", "Yoga", "Strength", "Swimming", "HIIT", "Other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={add} className="mt-4 gradient-hero text-primary-foreground rounded-2xl">Save</Button>
        </Card>
      )}

      <div className="mt-8 grid md:grid-cols-3 gap-4">
        {[
          { icon: Footprints, label: "Steps today", value: today?.steps?.toLocaleString() || "0", grad: "from-primary/10 to-primary-glow/5" },
          { icon: Flame, label: "Calories burned", value: today?.calories_burned ? `${today.calories_burned}` : "0", grad: "from-accent/10 to-accent/5" },
          { icon: Clock, label: "Active minutes", value: today?.workout_duration?.toString() || "0", grad: "from-success/10 to-success/5" },
        ].map(({ icon: Icon, label, value, grad }) => (
          <Card key={label} className={`p-6 border-0 shadow-soft rounded-3xl bg-gradient-to-br ${grad}`}>
            <div className="flex items-center justify-between"><Icon className="h-6 w-6 text-primary" /><TrendingUp className="h-4 w-4 text-success" /></div>
            <div className="mt-6 font-display text-4xl text-foreground">{value}</div>
            <div className="text-sm text-muted-foreground mt-1">{label}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <Card className="p-6 border-0 shadow-soft rounded-3xl">
          <h3 className="font-display text-2xl">Steps · last 7 days</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer><LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Line type="monotone" dataKey="steps" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))" }} />
            </LineChart></ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6 border-0 shadow-soft rounded-3xl">
          <h3 className="font-display text-2xl">Calories · last 7 days</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer><BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="cal" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
            </BarChart></ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6 border-0 shadow-soft rounded-3xl">
        <h3 className="font-display text-2xl">Week summary</h3>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div><div className="font-display text-3xl text-primary">{weekTotals.steps.toLocaleString()}</div><div className="text-xs text-muted-foreground">Total steps</div></div>
          <div><div className="font-display text-3xl text-accent">{weekTotals.cal.toFixed(0)}</div><div className="text-xs text-muted-foreground">Calories</div></div>
          <div><div className="font-display text-3xl text-success">{weekTotals.min}</div><div className="text-xs text-muted-foreground">Active min</div></div>
        </div>
      </Card>
    </div>
  );
};

export default Fitness;
