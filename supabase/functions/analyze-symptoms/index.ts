import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { symptoms } = await req.json();
    if (!symptoms || symptoms.length < 3) {
      return new Response(JSON.stringify({ error: "Please describe symptoms." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: records } = await supabase
      .from("medical_records")
      .select("file_name, ai_summary")
      .eq("user_id", user.id)
      .not("ai_summary", "is", null)
      .limit(20);

    const history = (records || []).map((r, i) => `Record ${i + 1} (${r.file_name}):\n${r.ai_summary}`).join("\n\n---\n\n") || "No prior medical records on file.";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You compare current symptoms with past medical history. Be conservative, never diagnose, always recommend a doctor." },
          { role: "user", content: `Current symptoms:\n${symptoms}\n\nPast medical record summaries:\n${history}\n\nIdentify whether the current symptoms may be related to any past condition, medicine, allergy, or test result. Explain in simple language. Do not give a confirmed diagnosis. End with: "Please consult a qualified doctor."` },
        ],
      }),
    });
    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await resp.json();
    const analysis = data.choices?.[0]?.message?.content || "";
    await supabase.from("symptom_analyses").insert({ user_id: user.id, symptoms, ai_analysis: analysis });
    return new Response(JSON.stringify({ analysis }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
