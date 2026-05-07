import { useMemo, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Heart, Loader2, User as UserIcon, Stethoscope, ShieldCheck, Sparkles, ArrowRight, Activity } from "lucide-react";
import authBg from "@/assets/auth-bg.jpg";
import { z } from "zod";

const baseSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(100),
});
const signupSchema = baseSchema.extend({
  name: z.string().trim().min(1, "Name is required").max(80),
});

const getRedirectPath = (role: "patient" | "doctor" | null) => role === "doctor" ? "/doctor" : "/choice";

const Auth = () => {
  const { user } = useAuth();
  const { role: savedRole } = useRole();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [role, setRole] = useState<"patient" | "doctor">("patient");

  const roleLabel = useMemo(() => role === "doctor" ? "Doctor" : "User", [role]);

  if (user) return <Navigate to={getRedirectPath(savedRole === "doctor" ? "doctor" : "patient")} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = mode === "signup" ? signupSchema.safeParse(form) : baseSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        localStorage.setItem("pending_role", role);
        const { error } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { emailRedirectTo: `${window.location.origin}/`, data: { name: form.name } },
        });
        if (error) throw error;
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user.id;
        if (uid) {
          const { data: existing, error: roleReadError } = await supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle();
          if (roleReadError) throw roleReadError;
          if (!existing) {
            const { error: insertError } = await supabase.from("user_roles").insert({ user_id: uid, role });
            if (insertError && !insertError.message.toLowerCase().includes("duplicate key value")) throw insertError;
          }
          localStorage.removeItem("pending_role");
          toast.success("Account created. You're in.");
          nav(getRedirectPath(role));
        } else {
          toast.success("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
        toast.success("Welcome back");
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user.id;
        if (uid) {
          const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle();
          nav(getRedirectPath((r?.role as "patient" | "doctor" | null) ?? null));
        } else {
          nav("/choice");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const google = async () => {
    localStorage.setItem("pending_role", role);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) {
      localStorage.removeItem("pending_role");
      toast.error(r.error instanceof Error ? r.error.message : "Google sign-in failed");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.15fr_0.85fr] bg-background">
      <div className="relative hidden lg:block overflow-hidden">
        <img src={authBg} alt="" width={1280} height={1600} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-sidebar/55" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 backdrop-blur"><Heart className="h-5 w-5" /></div>
            <span className="font-display text-2xl">FitMedi AI</span>
          </div>
          <div className="max-w-xl space-y-8 pb-12">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-white/70">Care platform</p>
              <h1 className="font-display text-6xl leading-[0.95] mt-4">One login for health tracking and clinical care.</h1>
              <p className="mt-4 max-w-lg text-base text-white/80">Patients can manage records and appointments, while doctors jump straight into schedules, requests, and patient summaries.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, title: "Secure access", text: "Protected records and role-based dashboards." },
                { icon: Activity, title: "Health tools", text: "Symptoms, records, and appointment tracking." },
                { icon: Sparkles, title: "Doctor ready", text: "Practice profile, availability, and visit flow." },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-[1.75rem] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-white" />
                  <div className="mt-4 text-lg font-semibold">{title}</div>
                  <p className="mt-2 text-sm text-white/75">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-lg">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl gradient-hero text-white shadow-elegant"><Heart className="h-5 w-5" /></div>
            <span className="font-display text-2xl text-foreground">FitMedi AI</span>
          </div>
          <Card className="border border-border/60 bg-card/95 shadow-elegant rounded-[2rem] p-8 md:p-10 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/70">Authentication</p>
                <h2 className="font-display text-4xl text-foreground mt-3">{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
                <p className="mt-3 text-sm text-muted-foreground">{mode === "signin" ? "Sign in to continue to your care workspace." : `Set up your ${roleLabel.toLowerCase()} access in one step.`}</p>
              </div>
              <div className="hidden sm:flex rounded-2xl bg-secondary/70 p-1">
                <button type="button" onClick={() => setMode("signin")} className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${mode === "signin" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"}`}>Sign in</button>
                <button type="button" onClick={() => setMode("signup")} className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${mode === "signup" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"}`}>Sign up</button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="mt-8 rounded-[1.5rem] bg-secondary/45 p-4">
                <Label className="text-sm font-medium text-foreground">Create access as</Label>
                <RadioGroup value={role} onValueChange={(v) => setRole(v as "patient" | "doctor")} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label htmlFor="r-patient" className={`flex items-center gap-3 rounded-[1.25rem] border bg-card px-4 py-4 cursor-pointer transition-colors ${role === "patient" ? "border-primary bg-secondary/50 shadow-soft" : "border-border/70 hover:bg-muted/60"}`}>
                    <RadioGroupItem id="r-patient" value="patient" />
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-primary"><UserIcon className="h-4 w-4" /></div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">User</div>
                      <div className="text-xs text-muted-foreground">Health records and appointments</div>
                    </div>
                  </label>
                  <label htmlFor="r-doctor" className={`flex items-center gap-3 rounded-[1.25rem] border bg-card px-4 py-4 cursor-pointer transition-colors ${role === "doctor" ? "border-primary bg-secondary/50 shadow-soft" : "border-border/70 hover:bg-muted/60"}`}>
                    <RadioGroupItem id="r-doctor" value="doctor" />
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-primary"><Stethoscope className="h-4 w-4" /></div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">Doctor</div>
                      <div className="text-xs text-muted-foreground">Practice dashboard and scheduling</div>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            )}

            <Button variant="outline" type="button" onClick={google} className="mt-8 w-full h-13 rounded-2xl border-border/80 bg-card text-foreground hover:bg-muted/60">
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </Button>
            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <div><Label>Full name</Label><Input className="mt-1.5 h-12 rounded-2xl border-border/80 bg-background/70" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" /></div>
              )}
              <div><Label>Email</Label><Input type="email" className="mt-1.5 h-12 rounded-2xl border-border/80 bg-background/70" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required /></div>
              <div><Label>Password</Label><Input type="password" className="mt-1.5 h-12 rounded-2xl border-border/80 bg-background/70" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required /></div>
              <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl gradient-hero text-primary-foreground shadow-elegant hover:opacity-95">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{mode === "signin" ? "Sign in" : `Create ${roleLabel} account`} <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
              <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-medium text-primary hover:underline">
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
