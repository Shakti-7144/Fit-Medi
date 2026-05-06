import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Heart, Home, Activity, Utensils, FileHeart, Stethoscope, LogOut, CalendarCheck, Users, Settings, UserCog } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";

const fitnessItems = [
  { to: "/choice", icon: Home, label: "Home" },
  { to: "/fitness", icon: Activity, label: "Fitness" },
  { to: "/meals", icon: Utensils, label: "Meals" },
  { to: "/profile", icon: Settings, label: "Profile" },
];

const healthItems = [
  { to: "/choice", icon: Home, label: "Home" },
  { to: "/health", icon: FileHeart, label: "Records" },
  { to: "/symptoms", icon: Stethoscope, label: "Symptoms" },
  { to: "/doctors", icon: Users, label: "Doctors" },
  { to: "/appointments", icon: CalendarCheck, label: "Appointments" },
];

const doctorItems = [
  { to: "/choice", icon: Home, label: "Home" },
  { to: "/doctor", icon: CalendarCheck, label: "Appointments" },
  { to: "/doctor/profile", icon: UserCog, label: "My Practice" },
  { to: "/profile", icon: Settings, label: "Profile" },
];

export const AppLayout = () => {
  const { signOut } = useAuth();
  const { role } = useRole();
  const nav = useNavigate();
  const loc = useLocation();
  const healthRoutes = ["/health", "/symptoms", "/doctors", "/appointments", "/book"];
  const isHealth = healthRoutes.some((r) => loc.pathname.startsWith(r));
  const items = role === "doctor" ? doctorItems : isHealth ? healthItems : fitnessItems;
  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground"><Heart className="h-5 w-5" /></div>
          <span className="font-display text-xl">FitMedi AI</span>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <button onClick={async () => { await signOut(); nav("/auth"); }} className="m-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>

      {/* mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around bg-sidebar text-sidebar-foreground py-2 border-t border-sidebar-border overflow-x-auto">
        {items.slice(0, 5).map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end className={({ isActive }) => cn("flex flex-col items-center gap-1 px-3 py-1.5 text-[10px]",
            isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70")}>
            <Icon className="h-5 w-5" /> {label}
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
};
