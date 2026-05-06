import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2, Plus, CalendarOff } from "lucide-react";
import { toast } from "sonner";

type Slot = { id: string; day_of_week: number; start_time: string; end_time: string };
type Block = { id: string; blocked_date: string; reason: string | null };

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DoctorProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ specialty: "", bio: "", qualifications: "", years_experience: "", location: "", consultation_fee: "" });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [newSlot, setNewSlot] = useState({ day_of_week: 1, start_time: "09:00", end_time: "17:00" });
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [newBlock, setNewBlock] = useState({ blocked_date: "", reason: "" });

  const load = async () => {
    if (!user) return;
    const [dp, av, bd] = await Promise.all([
      supabase.from("doctor_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("doctor_availability").select("*").eq("doctor_id", user.id).order("day_of_week"),
      supabase.from("blocked_dates").select("*").eq("doctor_id", user.id).order("blocked_date"),
    ]);
    if (dp.data) setProfile({
      specialty: dp.data.specialty ?? "", bio: dp.data.bio ?? "", qualifications: dp.data.qualifications ?? "",
      years_experience: dp.data.years_experience?.toString() ?? "", location: dp.data.location ?? "",
      consultation_fee: dp.data.consultation_fee?.toString() ?? "",
    });
    setSlots((av.data as Slot[]) || []);
    setBlocks((bd.data as Block[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("doctor_profiles").upsert({
      user_id: user.id,
      specialty: profile.specialty,
      bio: profile.bio || null,
      qualifications: profile.qualifications || null,
      years_experience: profile.years_experience ? parseInt(profile.years_experience) : 0,
      location: profile.location || null,
      consultation_fee: profile.consultation_fee ? parseFloat(profile.consultation_fee) : 0,
    }, { onConflict: "user_id" });
    if (error) toast.error(error.message); else toast.success("Practice info saved");
    setSaving(false);
  };

  const addSlot = async () => {
    if (!user) return;
    if (newSlot.start_time >= newSlot.end_time) return toast.error("End must be after start");
    const { error } = await supabase.from("doctor_availability").insert({ doctor_id: user.id, ...newSlot });
    if (error) toast.error(error.message); else { toast.success("Slot added"); load(); }
  };

  const delSlot = async (id: string) => {
    await supabase.from("doctor_availability").delete().eq("id", id); load();
  };

  const addBlock = async () => {
    if (!user || !newBlock.blocked_date) return toast.error("Pick a date");
    const { error } = await supabase.from("blocked_dates").insert({ doctor_id: user.id, blocked_date: newBlock.blocked_date, reason: newBlock.reason || null });
    if (error) toast.error(error.message); else { toast.success("Date blocked"); setNewBlock({ blocked_date: "", reason: "" }); load(); }
  };

  const delBlock = async (id: string) => {
    await supabase.from("blocked_dates").delete().eq("id", id); load();
  };

  if (loading) return <div className="grid place-items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <p className="text-sm text-accent font-medium">Practice</p>
      <h1 className="font-display text-4xl md:text-5xl text-foreground mt-1">My practice</h1>
      <p className="mt-2 text-muted-foreground">Information shown to patients searching for you.</p>

      <Card className="mt-8 p-6 md:p-8 border-0 shadow-soft rounded-3xl">
        <h2 className="font-display text-2xl">Profile</h2>
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div><Label>Specialty</Label><Input className="mt-1.5 h-11 rounded-xl" placeholder="e.g. Cardiology" value={profile.specialty} onChange={e => setProfile({ ...profile, specialty: e.target.value })} /></div>
          <div><Label>Location</Label><Input className="mt-1.5 h-11 rounded-xl" placeholder="City, Country" value={profile.location} onChange={e => setProfile({ ...profile, location: e.target.value })} /></div>
          <div><Label>Years of experience</Label><Input type="number" className="mt-1.5 h-11 rounded-xl" value={profile.years_experience} onChange={e => setProfile({ ...profile, years_experience: e.target.value })} /></div>
          <div><Label>Consultation fee (USD)</Label><Input type="number" className="mt-1.5 h-11 rounded-xl" value={profile.consultation_fee} onChange={e => setProfile({ ...profile, consultation_fee: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Qualifications</Label><Input className="mt-1.5 h-11 rounded-xl" placeholder="MBBS, MD…" value={profile.qualifications} onChange={e => setProfile({ ...profile, qualifications: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>About</Label><Textarea className="mt-1.5 rounded-xl" rows={4} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} /></div>
        </div>
        <Button onClick={save} disabled={saving} className="mt-6 gradient-hero text-primary-foreground rounded-2xl h-12 px-6 shadow-elegant">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Save
        </Button>
      </Card>

      <Card className="mt-6 p-6 md:p-8 border-0 shadow-soft rounded-3xl">
        <h2 className="font-display text-2xl">Weekly availability</h2>
        <p className="text-sm text-muted-foreground">Patients can book 30-minute slots inside these windows.</p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <Label>Day</Label>
            <select className="mt-1.5 h-11 rounded-xl border bg-background px-3 text-sm"
              value={newSlot.day_of_week} onChange={e => setNewSlot({ ...newSlot, day_of_week: parseInt(e.target.value) })}>
              {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div><Label>Start</Label><Input type="time" className="mt-1.5 h-11 rounded-xl" value={newSlot.start_time} onChange={e => setNewSlot({ ...newSlot, start_time: e.target.value })} /></div>
          <div><Label>End</Label><Input type="time" className="mt-1.5 h-11 rounded-xl" value={newSlot.end_time} onChange={e => setNewSlot({ ...newSlot, end_time: e.target.value })} /></div>
          <Button onClick={addSlot} className="rounded-xl h-11"><Plus className="h-4 w-4 mr-1" />Add</Button>
        </div>

        <div className="mt-6 space-y-2">
          {slots.length === 0 && <p className="text-sm text-muted-foreground">No availability yet — patients can't book until you add a slot.</p>}
          {slots.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
              <div className="text-sm"><strong>{days[s.day_of_week]}</strong> · {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</div>
              <Button size="sm" variant="ghost" onClick={() => delSlot(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 p-6 md:p-8 border-0 shadow-soft rounded-3xl">
        <h2 className="font-display text-2xl flex items-center gap-2"><CalendarOff className="h-5 w-5 text-primary" />Blocked dates</h2>
        <p className="text-sm text-muted-foreground">Days you are unavailable (vacation, holidays, etc.).</p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div><Label>Date</Label><Input type="date" className="mt-1.5 h-11 rounded-xl" value={newBlock.blocked_date} onChange={e => setNewBlock({ ...newBlock, blocked_date: e.target.value })} /></div>
          <div className="flex-1 min-w-[200px]"><Label>Reason (optional)</Label><Input className="mt-1.5 h-11 rounded-xl" placeholder="e.g. Conference" value={newBlock.reason} onChange={e => setNewBlock({ ...newBlock, reason: e.target.value })} /></div>
          <Button onClick={addBlock} className="rounded-xl h-11"><Plus className="h-4 w-4 mr-1" />Block</Button>
        </div>

        <div className="mt-6 space-y-2">
          {blocks.length === 0 && <p className="text-sm text-muted-foreground">No blocked dates.</p>}
          {blocks.map(b => (
            <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
              <div className="text-sm"><strong>{b.blocked_date}</strong>{b.reason ? ` · ${b.reason}` : ""}</div>
              <Button size="sm" variant="ghost" onClick={() => delBlock(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DoctorProfile;
