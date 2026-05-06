import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Check, X, CalendarCheck, Stethoscope, FileText, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Appt = {
  id: string; patient_id: string; scheduled_at: string; reason: string | null;
  status: "pending" | "confirmed" | "declined" | "completed" | "cancelled"; doctor_notes: string | null;
};
type Patient = { id: string; name: string | null; email: string | null; avatar_url: string | null };

const statusColor: Record<string, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  confirmed: "bg-success/15 text-success border-success/30",
  declined: "bg-destructive/10 text-destructive border-destructive/30",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appts, setAppts] = useState<Appt[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [loading, setLoading] = useState(true);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [rescheduleFor, setRescheduleFor] = useState<string | null>(null);
  const [rescheduleAt, setRescheduleAt] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("appointments").select("*").eq("doctor_id", user.id).order("scheduled_at", { ascending: false });
    const list = (data as Appt[]) || [];
    setAppts(list);
    const ids = [...new Set(list.map(a => a.patient_id))];
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, name, email, avatar_url").in("id", ids);
      const map: Record<string, Patient> = {};
      (ps as Patient[] || []).forEach(p => { map[p.id] = p; });
      setPatients(map);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const update = async (id: string, patch: Partial<Appt>) => {
    const { error } = await supabase.from("appointments").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); load(); }
  };

  const saveNote = async (id: string) => {
    await update(id, { doctor_notes: note });
    setNoteFor(null); setNote("");
  };

  const saveReschedule = async (id: string) => {
    if (!rescheduleAt) return toast.error("Pick a date and time");
    await update(id, { scheduled_at: new Date(rescheduleAt).toISOString(), status: "pending" });
    setRescheduleFor(null); setRescheduleAt("");
  };

  if (loading) return <div className="grid place-items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const pending = appts.filter(a => a.status === "pending");
  const upcoming = appts.filter(a => a.status === "confirmed" && new Date(a.scheduled_at) >= new Date());
  const past = appts.filter(a => a.status === "completed" || a.status === "declined" || a.status === "cancelled" || (a.status === "confirmed" && new Date(a.scheduled_at) < new Date()));

  const Row = ({ a }: { a: Appt }) => {
    const p = patients[a.patient_id];
    return (
      <Card className="p-5 border-0 shadow-soft rounded-2xl">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary"><Stethoscope className="h-5 w-5" /></div>
          <div className="flex-1 min-w-[200px]">
            <div className="font-medium">{p?.name || p?.email || "Patient"}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{format(new Date(a.scheduled_at), "PPP · p")}</div>
            {a.reason && <p className="text-sm mt-2">{a.reason}</p>}
            {a.doctor_notes && <p className="text-sm mt-2 p-3 rounded-xl bg-muted/50"><strong>Note:</strong> {a.doctor_notes}</p>}
            {noteFor === a.id && (
              <div className="mt-3 space-y-2">
                <Textarea className="rounded-xl" placeholder="Add a note for the patient" value={note} onChange={e => setNote(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveNote(a.id)}>Save note</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setNoteFor(null); setNote(""); }}>Cancel</Button>
                </div>
              </div>
            )}
            {rescheduleFor === a.id && (
              <div className="mt-3 space-y-2">
                <Input type="datetime-local" className="rounded-xl" value={rescheduleAt} onChange={e => setRescheduleAt(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveReschedule(a.id)}>Save new time</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setRescheduleFor(null); setRescheduleAt(""); }}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={`rounded-full border ${statusColor[a.status]} capitalize`}>{a.status}</Badge>
            <div className="flex gap-2 flex-wrap justify-end">
              {a.status === "pending" && <>
                <Button size="sm" onClick={() => update(a.id, { status: "confirmed" })} className="gradient-hero text-primary-foreground rounded-xl"><Check className="h-3.5 w-3.5 mr-1" />Confirm</Button>
                <Button size="sm" variant="outline" onClick={() => update(a.id, { status: "declined" })} className="rounded-xl"><X className="h-3.5 w-3.5 mr-1" />Decline</Button>
              </>}
              {a.status === "confirmed" && <>
                <Button size="sm" variant="outline" onClick={() => update(a.id, { status: "completed" })} className="rounded-xl">Mark complete</Button>
              </>}
              {(a.status === "pending" || a.status === "confirmed") && (
                <Button size="sm" variant="ghost" onClick={() => { setRescheduleFor(a.id); setRescheduleAt(""); }}><CalendarClock className="h-3.5 w-3.5 mr-1" />Reschedule</Button>
              )}
              {(a.status === "confirmed" || a.status === "completed") && (
                <Button asChild size="sm" variant="ghost"><Link to={`/doctor/patient/${a.patient_id}`}><FileText className="h-3.5 w-3.5 mr-1" />View summary</Link></Button>
              )}
              {a.status !== "cancelled" && a.status !== "declined" && (
                <Button size="sm" variant="ghost" onClick={() => { setNoteFor(a.id); setNote(a.doctor_notes || ""); }}>Add note</Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <p className="text-sm text-accent font-medium">Practice</p>
      <h1 className="font-display text-4xl md:text-5xl text-foreground mt-1">Appointments</h1>
      <p className="mt-2 text-muted-foreground">Review requests and manage your schedule.</p>

      <Tabs defaultValue="pending" className="mt-8">
        <TabsList className="rounded-2xl">
          <TabsTrigger value="pending" className="rounded-xl">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="upcoming" className="rounded-xl">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past" className="rounded-xl">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4 space-y-3">
          {pending.length === 0 ? <Empty /> : pending.map(a => <Row key={a.id} a={a} />)}
        </TabsContent>
        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {upcoming.length === 0 ? <Empty /> : upcoming.map(a => <Row key={a.id} a={a} />)}
        </TabsContent>
        <TabsContent value="past" className="mt-4 space-y-3">
          {past.length === 0 ? <Empty /> : past.map(a => <Row key={a.id} a={a} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Empty = () => (
  <Card className="p-12 text-center border-0 shadow-soft rounded-3xl">
    <CalendarCheck className="h-10 w-10 mx-auto text-muted-foreground" />
    <p className="mt-3 text-muted-foreground">Nothing here yet.</p>
  </Card>
);

export default DoctorDashboard;
