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

    const { recordId } = await req.json();
    const { data: record, error } = await supabase.from("medical_records").select("*").eq("id", recordId).single();
    if (error || !record) return new Response(JSON.stringify({ error: "Record not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Generate signed URL for the file
    const { data: signed } = await supabase.storage.from("medical-records").createSignedUrl(record.file_path, 60);
    const fileUrl = signed?.signedUrl;

    const isImage = record.file_type?.startsWith("image/");
    const userContent: any[] = [
      { type: "text", text: `File name: ${record.file_name}\n\nSummarize this medical record in simple language. Extract: diagnosis, medicines, test results, allergies, previous conditions, treatment plan, and important warnings. Do NOT provide a final medical diagnosis. End with: "This is an AI-generated summary. A doctor must verify it."` },
    ];
    if (isImage && fileUrl) userContent.push({ type: "image_url", image_url: { url: fileUrl } });
    else userContent.push({ type: "text", text: `(File reference: ${fileUrl || record.file_name}. If you cannot access content, summarize based on filename and respond accordingly.)` });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a careful medical document summarizer. Be clear, structured, and conservative. Never give a final diagnosis." },
          { role: "user", content: userContent },
        ],
      }),
    });
    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await resp.json();
    const summary = data.choices?.[0]?.message?.content || "";
    await supabase.from("medical_records").update({ ai_summary: summary }).eq("id", recordId);
    return new Response(JSON.stringify({ summary }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
