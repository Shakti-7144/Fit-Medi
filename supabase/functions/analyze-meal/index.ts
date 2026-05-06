import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { mealName, mealDescription, imageBase64 } = await req.json();
    if (!mealName && !imageBase64) {
      return new Response(JSON.stringify({ error: "mealName or imageBase64 required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const textPrompt = imageBase64
      ? `Identify the meal in the image. ${mealName ? `User says: ${mealName}.` : ""} ${mealDescription ? `Notes: ${mealDescription}.` : ""}\n\nEstimate calories, protein (g), carbs (g), fats (g), fiber (g), key vitamins and minerals. Provide a confidence level and brief health suggestion. Also return a short detected_name.`
      : `Meal: ${mealName}\nDescription: ${mealDescription || "n/a"}\n\nAnalyze this meal. Estimate calories, protein (g), carbs (g), fats (g), fiber (g), key vitamins and minerals. Provide a confidence level (low/medium/high) and a brief health suggestion.`;

    const userContent: any = imageBase64
      ? [
          { type: "text", text: textPrompt },
          { type: "image_url", image_url: { url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` } },
        ]
      : textPrompt;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a precise nutrition analyzer with vision capabilities. Always return structured data via the provided tool." },
          { role: "user", content: userContent },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_nutrition",
            description: "Report estimated nutrition for a meal",
            parameters: {
              type: "object",
              properties: {
                detected_name: { type: "string", description: "What the meal appears to be (especially when identifying from image)" },
                calories: { type: "number" },
                protein_g: { type: "number" },
                carbs_g: { type: "number" },
                fats_g: { type: "number" },
                fiber_g: { type: "number" },
                vitamins: { type: "array", items: { type: "string" } },
                minerals: { type: "array", items: { type: "string" } },
                confidence: { type: "string", enum: ["low", "medium", "high"] },
                suggestion: { type: "string" },
              },
              required: ["calories", "protein_g", "carbs_g", "fats_g", "confidence", "suggestion"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_nutrition" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit, try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      return new Response(JSON.stringify({ error: "AI error", details: t }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const nutrition = args ? JSON.parse(args) : null;
    return new Response(JSON.stringify({ nutrition }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
