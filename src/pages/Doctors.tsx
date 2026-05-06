import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Stethoscope, Search, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Doc = { user_id: string; specialty: string; bio: string | null; qualifications: string | null; years_experience: number | null; location: string | null; consultation_fee: number | null; name: string | null; avatar_url: string | null };

const Doctors = () => {
  const nav = useNavigate();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (supabase.from as any)("doctors_directory").select("*").then(({ data }: any) => {
      setDocs((data as Doc[]) || []); setLoading(false);
    });
  }, []);

  const filtered = docs.filter(d =>
    !q || d.name?.toLowerCase().includes(q.toLowerCase()) || d.specialty?.toLowerCase().includes(q.toLowerCase()) || d.location?.toLowerCase().includes(q.toLowerCase())
  );

  if (loading) return <div className="grid place-items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <p className="text-sm text-primary font-medium">Care</p>
      <h1 className="font-display text-4xl md:text-5xl text-foreground mt-1">Find a doctor</h1>
      <p className="mt-2 text-muted-foreground">Browse verified practitioners and request an appointment.</p>

      <div className="relative mt-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, specialty, or location" value={q} onChange={e => setQ(e.target.value)} className="pl-9 h-12 rounded-2xl" />
      </div>

      <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">No doctors found.</p>}
        {filtered.map(d => (
          <Card key={d.user_id} className="p-6 border-0 shadow-soft rounded-3xl hover:shadow-elegant transition-all">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-4 ring-secondary">
                <AvatarImage src={d.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground"><Stethoscope className="h-6 w-6" /></AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="font-display text-xl truncate">Dr. {d.name || "Unnamed"}</h3>
                <Badge variant="secondary" className="mt-1 rounded-full">{d.specialty || "General"}</Badge>
              </div>
            </div>
            {d.bio && <p className="mt-4 text-sm text-muted-foreground line-clamp-3">{d.bio}</p>}
            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              {d.location && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{d.location}</div>}
              {d.years_experience ? <div>{d.years_experience} yrs experience</div> : null}
              {d.consultation_fee ? <div className="text-foreground font-medium">${Number(d.consultation_fee).toFixed(0)} / visit</div> : null}
            </div>
            <Button onClick={() => nav(`/book/${d.user_id}`)} className="mt-5 w-full gradient-hero text-primary-foreground rounded-2xl h-11 shadow-elegant">
              <Calendar className="h-4 w-4 mr-2" />Book appointment
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Doctors;
