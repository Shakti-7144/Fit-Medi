import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Loader2, Stethoscope, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

type Doc = { user_id: string; specialty: string; bio: string | null; name: string | null; avatar_url: string | null; consultation_fee: number | null };
type Slot = { day_of_week: number; start_time: string; end_time: string };
type Existing = { scheduled_at: string };

const BookAppointment = () => {
  const { doctorId = "" } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [avail, setAvail] = useState<Slot[]>([]);
  const [existing, setExisting] = useState<Existing[]>([]);
  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [time, setTime] = useState<string>("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [d, a, e] = await Promise.all([
        (supabase.from as any)("doctors_directory").select("*").eq("user_id", doctorId).maybeSingle(),
        supabase.from("doctor_availability").select("*").eq("doctor_id", doctorId),
        supabase.from("appointments").select("scheduled_at").eq("doctor_id", doctorId).in("status", ["pending", "confirmed"]),
      ]);
      setDoc(d.data as any); setAvail((a.data as Slot[]) || []); setExisting((e.data as Existing[]) || []);
      setLoading(false);
    })();
  }, [doctorId]);

  const slots = useMemo(() => {
    if (!date) return [];
    const dow = date.getDay();
    const todays = avail.filter(a => a.day_of_week === dow);
    const out: string[] = [];
    todays.forEach(s => {
      const [sh, sm] = s.start_time.split(":").map(Number);
      const [eh, em] = s.end_time.split(":").map(Number);
      const start = sh * 60 + sm; const end = eh * 60 + em;
      for (let m = start; m + 30 <= end; m += 30) {
        out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
      }
    });
    const taken = new Set(existing.map(e => format(new Date(e.scheduled_at), "yyyy-MM-dd HH:mm"))
      .filter(k => k.startsWith(format(date, "yyyy-MM-dd"))));
    return out.filter(t => !taken.has(`${format(date, "yyyy-MM-dd")} ${t}`));
  }, [date, avail, existing]);

  const book = async () => {
    if (!user || !date || !time) return toast.error("Pick date and time");
    setSubmitting(true);
    const [h, m] = time.split(":").map(Number);
    const dt = new Date(date); dt.setHours(h, m, 0, 0);
    const { error } = await supabase.from("appointments").insert({
      patient_id: user.id, doctor_id: doctorId, scheduled_at: dt.toISOString(), reason: reason || null,
    });
    if (error) { toast.error(error.message); setSubmitting(false); return; }
    toast.success("Request sent. The doctor will confirm soon.");
    nav("/appointments");
  };

  if (loading) return <div className="grid place-items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!doc) return <div className="p-10 text-center text-muted-foreground">Doctor not found.</div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <Button variant="ghost" onClick={() => nav(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
      <Card className="p-6 md:p-8 border-0 shadow-soft rounded-3xl">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-4 ring-secondary">
            <AvatarImage src={doc.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground"><Stethoscope className="h-6 w-6" /></AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-display text-3xl">Dr. {doc.name}</h1>
            <Badge variant="secondary" className="rounded-full mt-1">{doc.specialty}</Badge>
          </div>
        </div>
        {doc.bio && <p className="mt-4 text-sm text-muted-foreground">{doc.bio}</p>}
      </Card>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <Card className="p-6 border-0 shadow-soft rounded-3xl">
          <h3 className="font-display text-2xl">Select a date</h3>
          <Calendar
            mode="single" selected={date} onSelect={setDate}
            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            className={cn("p-3 pointer-events-auto mt-2")}
          />
        </Card>

        <Card className="p-6 border-0 shadow-soft rounded-3xl">
          <h3 className="font-display text-2xl">Available times</h3>
          {slots.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No availability on this day. Try another.</p>
          ) : (
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map(s => (
                <button key={s} onClick={() => setTime(s)}
                  className={cn("h-10 rounded-xl text-sm font-medium border transition-colors",
                    time === s ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-secondary")}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="mt-6">
            <Label>Reason for visit (optional)</Label>
            <Textarea className="mt-1.5 rounded-xl" placeholder="Briefly describe your symptoms or reason"
              value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          <Button onClick={book} disabled={submitting || !time} className="mt-5 w-full gradient-hero text-primary-foreground rounded-2xl h-12 shadow-elegant">
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Request appointment
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default BookAppointment;
