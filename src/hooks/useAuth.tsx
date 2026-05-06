import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = { user: User | null; session: Session | null; loading: boolean; signOut: () => Promise<void> };
const Ctx = createContext<AuthCtx>({ user: null, session: null, loading: true, signOut: async () => {} });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evt, s) => {
      setSession(s); setUser(s?.user ?? null); setLoading(false);
      if (evt === "SIGNED_IN" && s?.user) {
        const pending = localStorage.getItem("pending_role");
        if (pending === "patient" || pending === "doctor") {
          // Defer to avoid blocking the auth callback
          setTimeout(async () => {
            const { data: existing } = await supabase
              .from("user_roles").select("role").eq("user_id", s.user.id).maybeSingle();
            if (!existing) {
              await supabase.from("user_roles").insert({ user_id: s.user.id, role: pending as "patient" | "doctor" });
            }
            localStorage.removeItem("pending_role");
          }, 0);
        }
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setUser(session?.user ?? null); setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  return <Ctx.Provider value={{ user, session, loading, signOut: async () => { await supabase.auth.signOut(); } }}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
