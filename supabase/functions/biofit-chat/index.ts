import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  general: `You are BioFit AI, a knowledgeable health, nutrition, and fitness assistant. You provide accurate, evidence-based advice about:
- Diet analysis and meal planning
- Nutritional information and calorie counting
- Fitness plans and exercise guidance
- BMI and body composition
- Grocery shopping for specific diets
- Recipe suggestions based on dietary needs

You are friendly, motivating, and thorough. When discussing exercises, always include proper form instructions and safety tips. When discussing nutrition, mention macros (protein, carbs, fats) and calories when relevant.

You support these diet goals: weight loss, muscle gain, maintenance, keto, vegan, vegetarian, high-protein, low-carb, Mediterranean.

Always format your responses clearly with markdown when appropriate.`,
  voice: `You are BioFit AI in voice conversation mode. Keep responses SHORT and conversational (1-3 sentences max). No markdown.`,
  recipes: `You are BioFit's recipe chef AI. Generate recipes that fit the user's diet with ingredients, steps, and macros.`,
  scan_meal: `You are BioFit AI, a nutrition expert. Analyze food images and ALWAYS include a JSON block at the end with meal_name, calories, protein, carbs, fat, fiber values.`,
};

const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 2000;
const MAX_CONTEXT_CHARS = 500;

const GROQ_TEXT_MODEL = "llama-3.3-70b-versatile";
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function toGroqContent(content: unknown) {
  return typeof content === "string" ? content : JSON.stringify(content);
}

function toGroqMessages(messages: any[], image?: string) {
  return (messages || []).map((msg, index, all) => {
    const isLastUserMessage = index === all.length - 1 && msg.role === "user";

    if (isLastUserMessage && image) {
      return {
        role: msg.role,
        content: [
          { type: "text", text: toGroqContent(msg.content) },
          { type: "image_url", image_url: { url: image } },
        ],
      };
    }

    return {
      role: msg.role,
      content: toGroqContent(msg.content),
    };
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice("Bearer ".length);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: claimsData, error: claimsErr } = await sb.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub || claimsData.claims.role === "anon") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, promptId, userContext, image } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: `messages must be a non-empty array of at most ${MAX_MESSAGES} items` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    for (const m of messages) {
      if (!m || (m.role !== "user" && m.role !== "assistant")) {
        return new Response(JSON.stringify({ error: "invalid message role" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const c = toGroqContent(m.content);
      if (typeof c !== "string" || c.length > MAX_MESSAGE_CHARS) {
        return new Response(JSON.stringify({ error: `message content must be <= ${MAX_MESSAGE_CHARS} chars` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    if (userContext && (typeof userContext !== "string" || userContext.length > MAX_CONTEXT_CHARS)) {
      return new Response(JSON.stringify({ error: `userContext must be a string <= ${MAX_CONTEXT_CHARS} chars` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const system = SYSTEM_PROMPTS[promptId as string] ?? SYSTEM_PROMPTS.general;

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const contextAddition = userContext ? `\n\nUser context: ${userContext}` : "";

    const groqMessages = [
      {
        role: "system",
        content: system + contextAddition,
      },
      ...toGroqMessages(messages || [], image),
    ];

    const groqResp = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: image ? GROQ_VISION_MODEL : GROQ_TEXT_MODEL,
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: true,
      }),
    });

    if (!groqResp.ok || !groqResp.body) {
      const errorText = await groqResp.text();
      console.error("Groq error:", groqResp.status, errorText);

      if (groqResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited by Groq. Please try again shortly." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (groqResp.status === 401) {
        return new Response(
          JSON.stringify({ error: "GROQ_API_KEY is invalid or expired" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "AI service error",
          details: errorText.slice(0, 300),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const reader = groqResp.body.getReader();
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

              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") break;

              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;

                if (content) {
                  const chunk = {
                    choices: [{ delta: { content } }],
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                }
              } catch {
                buffer = line + "\n" + buffer;
                break;
              }
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (e) {
          console.error("Stream error:", e);
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
