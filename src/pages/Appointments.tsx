import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarCheck, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Appt = {
  id: string; doctor_id: string; scheduled_at: string; reason: string | null;
  status: "pending" | "confirmed" | "declined" | "completed" | "cancelled";
  doctor_notes: string | null;
};
type Doc = { user_id: string; name: string | null; specialty: string };

const statusColor: Record<string, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  confirmed: "bg-success/15 text-success border-success/30",
  declined: "bg-destructive/10 text-destructive border-destructive/30",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const Appointments = () => {
  const { user } = useAuth();
  const [appts, setAppts] = useState<Appt[]>([]);
  const [docs, setDocs] = useState<Record<string, Doc>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("appointments").select("*").eq("patient_id", user.id).order("scheduled_at", { ascending: false });
    const list = (data as Appt[]) || [];
    setAppts(list);
    const ids = [...new Set(list.map(a => a.doctor_id))];
    if (ids.length) {
      const { data: ds } = await (supabase.from as any)("doctors_directory").select("*").in("user_id", ids);
      const map: Record<string, Doc> = {};
      ((ds as Doc[]) || []).forEach((d: Doc) => { map[d.user_id] = d; });
      setDocs(map);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const cancel = async (id: string) => {
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Cancelled"); load(); }
  };

  if (loading) return <div className="grid place-items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <p className="text-sm text-primary font-medium">Care</p>
      <h1 className="font-display text-4xl md:text-5xl text-foreground mt-1">My appointments</h1>
      <p className="mt-2 text-muted-foreground">Track requests and confirmed visits.</p>

      <div className="mt-8 space-y-3">
        {appts.length === 0 && (
          <Card className="p-12 text-center border-0 shadow-soft rounded-3xl">
            <CalendarCheck className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No appointments yet.</p>
          </Card>
        )}
        {appts.map(a => {
          const d = docs[a.doctor_id];
          return (
            <Card key={a.id} className="p-5 border-0 shadow-soft rounded-2xl">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary"><CalendarCheck className="h-5 w-5" /></div>
                <div className="flex-1 min-w-[200px]">
                  <div className="font-medium">Dr. {d?.name || "—"} <span className="text-muted-foreground font-normal">· {d?.specialty}</span></div>
                  <div className="text-sm text-muted-foreground mt-0.5">{format(new Date(a.scheduled_at), "PPP · p")}</div>
                  {a.reason && <p className="text-sm mt-2">{a.reason}</p>}
                  {a.doctor_notes && <p className="text-sm mt-2 p-3 rounded-xl bg-muted/50"><strong>Doctor's note:</strong> {a.doctor_notes}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={`rounded-full border ${statusColor[a.status]} capitalize`}>{a.status}</Badge>
                  {(a.status === "pending" || a.status === "confirmed") && (
                    <Button variant="ghost" size="sm" onClick={() => cancel(a.id)}><X className="h-3.5 w-3.5 mr-1" />Cancel</Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Appointments;
