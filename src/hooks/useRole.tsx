import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "patient" | "doctor" | "admin";

export const useRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setRole(null); setLoading(false); return; }

    let cancelled = false;

    const fetchRole = async (attempt = 0) => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
      const nextRole = (data?.role as AppRole) ?? null;
      const pending = localStorage.getItem("pending_role");

      if (!nextRole && pending && attempt < 5) {
        setTimeout(() => { if (!cancelled) void fetchRole(attempt + 1); }, 250);
        return;
      }

      if (!cancelled) {
        setRole(nextRole);
        setLoading(false);
      }
    };

    setLoading(true);
    void fetchRole();

    return () => { cancelled = true; };
  }, [user]);

  return { role, loading };
};
