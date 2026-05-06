import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Stethoscope, Loader2 } from "lucide-react";
import { toast } from "sonner";

const RoleSelect = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.role) nav("/choice", { replace: true }); else setChecking(false);
    });
  }, [user, nav]);

  const pick = async (role: "patient" | "doctor") => {
    if (!user) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role });
    if (error) { toast.error(error.message); return; }
    toast.success(`Welcome, ${role === "patient" ? "patient" : "doctor"}`);
    nav("/choice");
  };

  if (checking) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-secondary/40 via-background to-accent-soft/40 p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl text-foreground">Who are you?</h1>
          <p className="mt-3 text-muted-foreground">Choose your role to personalize your experience</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { role: "patient" as const, icon: User, title: "I'm a User", desc: "Track fitness, log meals, and manage your health records.", grad: "gradient-hero" },
            { role: "doctor" as const, icon: Stethoscope, title: "I'm a Doctor", desc: "Manage appointments, schedule, and patient summaries.", grad: "gradient-coral" },
          ].map(({ role, icon: Icon, title, desc, grad }) => (
            <Card key={role} className="group cursor-pointer border-0 shadow-soft hover:shadow-elegant transition-all duration-500 rounded-3xl p-8 hover:-translate-y-1" onClick={() => pick(role)}>
              <div className={`${grad} grid h-16 w-16 place-items-center rounded-2xl text-white shadow-elegant`}><Icon className="h-8 w-8" /></div>
              <h3 className="mt-6 font-display text-2xl text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              <Button variant="ghost" className="mt-6 -ml-3 text-primary group-hover:translate-x-1 transition-transform">Continue →</Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleSelect;
