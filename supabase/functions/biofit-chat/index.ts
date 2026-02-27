import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_SYSTEM = `You are BioFit AI, a knowledgeable health, nutrition, and fitness assistant. You provide accurate, evidence-based advice about:
- Diet analysis and meal planning
- Nutritional information and calorie counting
- Fitness plans and exercise guidance
- BMI and body composition
- Grocery shopping for specific diets
- Recipe suggestions based on dietary needs

You are friendly, motivating, and thorough. When discussing exercises, always include proper form instructions and safety tips. When discussing nutrition, mention macros (protein, carbs, fats) and calories when relevant.

You support these diet goals: weight loss, muscle gain, maintenance, keto, vegan, vegetarian, high-protein, low-carb, Mediterranean.

Always format your responses clearly with markdown when appropriate.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, systemPrompt, extraContext, image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const system = systemPrompt || DEFAULT_SYSTEM;
    const contextAddition = extraContext ? `\n\nAdditional context: ${extraContext}` : "";

    const apiMessages: any[] = [
      { role: "system", content: system + contextAddition },
    ];

    // Handle image analysis
    if (image) {
      apiMessages.push({
        role: "user",
        content: [
          { type: "image_url", image_url: { url: image } },
          { type: "text", text: messages[messages.length - 1]?.content || "Analyze this meal" },
        ],
      });
    } else {
      apiMessages.push(...messages);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
