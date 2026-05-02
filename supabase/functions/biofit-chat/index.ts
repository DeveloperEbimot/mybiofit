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

const GEMINI_MODEL = "gemini-2.0-flash";

// Convert OpenAI-style messages to Gemini "contents" format
function toGeminiContents(messages: any[], image?: string) {
  const contents: any[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const role = m.role === "assistant" ? "model" : "user";
    const isLast = i === messages.length - 1;
    const parts: any[] = [];
    if (isLast && image && m.role === "user") {
      // Extract base64 from data URL if present
      const match = /^data:(.+);base64,(.+)$/.exec(image);
      if (match) {
        parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
      }
      parts.push({ text: m.content || "Analyze this meal" });
    } else {
      parts.push({ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) });
    }
    contents.push({ role, parts });
  }
  return contents;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, systemPrompt, extraContext, image } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const system = systemPrompt || DEFAULT_SYSTEM;
    const contextAddition = extraContext ? `\n\nAdditional context: ${extraContext}` : "";

    const contents = toGeminiContents(messages || [], image);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

    const geminiResp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system + contextAddition }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    });

    if (!geminiResp.ok || !geminiResp.body) {
      const t = await geminiResp.text();
      console.error("Gemini error:", geminiResp.status, t);
      if (geminiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited by Gemini. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error", details: t.slice(0, 300) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Re-stream Gemini SSE as OpenAI-compatible SSE chunks the frontend already parses.
    const reader = geminiResp.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let idx;
            while ((idx = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, idx);
              buffer = buffer.slice(idx + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ")) continue;
              const json = line.slice(6).trim();
              if (!json) continue;
              try {
                const parsed = JSON.parse(json);
                const text = parsed?.candidates?.[0]?.content?.parts
                  ?.map((p: any) => p.text || "")
                  .join("") || "";
                if (text) {
                  const chunk = {
                    choices: [{ delta: { content: text } }],
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                }
              } catch {
                // partial; put back and wait
                buffer = line + "\n" + buffer;
                break;
              }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          console.error("stream error:", e);
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
