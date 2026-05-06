import { useNavigate, Navigate } from "react-router-dom";
import { Activity, FileHeart, LogOut, Heart, CalendarCheck, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Loader2 } from "lucide-react";

const Choice = () => {
  const nav = useNavigate();
  const { signOut, user } = useAuth();
  const { role, loading } = useRole();

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!role) return <Navigate to="/role" replace />;

  const tiles = role === "doctor"
    ? [
        { to: "/doctor", icon: CalendarCheck, label: "Appointments", sub: "Patient requests & schedule", grad: "gradient-hero", shadow: "shadow-glow" },
        { to: "/doctor/profile", icon: Settings, label: "My Practice", sub: "Profile & availability", grad: "gradient-coral", shadow: "shadow-coral" },
      ]
    : [
        { to: "/fitness", icon: Activity, label: "Fitness", sub: "Track movement & meals", grad: "gradient-hero", shadow: "shadow-glow" },
        { to: "/health", icon: FileHeart, label: "Health Records", sub: "Records & AI insights", grad: "gradient-coral", shadow: "shadow-coral" },
      ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-secondary/30 via-background to-accent-soft/30">
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary-glow/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

      <header className="relative z-10 flex items-center justify-between p-6 lg:p-8">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl gradient-hero text-white"><Heart className="h-5 w-5" /></div>
          <span className="font-display text-2xl text-foreground">FitMedi AI</span>
        </div>
        <div className="flex items-center gap-2">
          {role === "patient" && (
            <Button variant="ghost" onClick={() => nav("/doctors")}><Users className="h-4 w-4 mr-2" />Find a doctor</Button>
          )}
          <Button variant="ghost" onClick={() => nav("/profile")}><Settings className="h-4 w-4 mr-2" />Profile</Button>
          <Button variant="ghost" onClick={async () => { await signOut(); nav("/auth"); }}><LogOut className="h-4 w-4 mr-2" />Sign out</Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 pt-8 pb-20 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary/70">Hello{user?.email ? `, ${user.email.split("@")[0]}` : ""}</p>
        <h1 className="font-display text-5xl md:text-7xl text-foreground mt-4 leading-tight">
          {role === "doctor" ? "Welcome, Doctor." : "What brings you here today?"}
        </h1>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Pick a space to enter. You can switch anytime.</p>

        <div className="mt-16 grid md:grid-cols-2 gap-10 md:gap-16 place-items-center">
          {tiles.map(({ to, icon: Icon, label, sub, grad, shadow }) => (
            <button key={to} onClick={() => nav(to)} className="group flex flex-col items-center gap-6">
              <div className={`relative grid h-64 w-64 md:h-72 md:w-72 place-items-center rounded-full ${grad} ${shadow} text-white transition-all duration-500 group-hover:scale-105 animate-float`}>
                <div className="absolute inset-3 rounded-full border border-white/30" />
                <Icon className="h-24 w-24" strokeWidth={1.3} />
              </div>
              <div>
                <div className="font-display text-3xl text-foreground">{label}</div>
                <div className="mt-1 text-sm text-muted-foreground">{sub}</div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Choice;
