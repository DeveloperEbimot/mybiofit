import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-biofit-anon-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Server-side prompt allowlist. Clients pick a promptId; they cannot supply prompt text.
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
  voice: `You are BioFit AI in voice conversation mode. Keep responses SHORT and conversational (1-3 sentences max), like a real spoken chat. Be warm, motivating, and natural. Do not use markdown, lists, or formatting — only plain spoken language.`,
  recipes: `You are BioFit's recipe chef AI. Generate recipes that fit the user's diet. Always include: recipe name, prep/cook time, ingredients, step-by-step instructions, and macros. Format with markdown.`,
  scan_meal: `You are BioFit AI, a nutrition expert. Analyze food images and provide detailed nutritional analysis. Always estimate calories and macronutrients. Be encouraging but honest. ALWAYS include a JSON block at the end with meal_name, calories, protein, carbs, fat, fiber values.`,
};

// Limits to prevent abuse / token inflation.
const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 2000;
const MAX_CONTEXT_CHARS = 500;

const GROQ_TEXT_MODEL = "llama-3.3-70b-versatile";
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Cloudflare Workers AI fallback (OpenAI-compatible chat completions)
const CF_TEXT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const CF_VISION_MODEL = "@cf/meta/llama-3.2-11b-vision-instruct";

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
    // --- Auth: allow signed-in users OR anonymous callers (client enforces 2-use limit). ---
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice("Bearer ".length);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: claimsData } = await supabase.auth.getClaims(token);
    const isAuthed = !!claimsData?.claims?.sub && claimsData.claims.role !== "anon";
    if (!isAuthed) {
      // Anonymous: must present a stable client id so we can correlate abuse if needed.
      const anonId = req.headers.get("x-biofit-anon-id") || "";
      if (!anonId || anonId.length < 8 || anonId.length > 64) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json();
    const { messages, promptId, userContext, image } = body ?? {};

    // --- Validate inputs ---
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
    const CF_TOKEN = Deno.env.get("CLOUDFLARE_AI_TOKEN");
    const CF_ACCOUNT = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    if (!GROQ_API_KEY && !(CF_TOKEN && CF_ACCOUNT)) {
      throw new Error("No AI provider configured");
    }

    const contextAddition = userContext ? `\n\nUser context: ${userContext}` : "";

    // Build messages for Groq (OpenAI-compatible format)
    const groqMessages = [];
    
    // Add system message
    groqMessages.push({
      role: "system",
      content: system + contextAddition,
    });

    groqMessages.push(...toGroqMessages(messages || [], image));

    // Try Groq first; on failure (auth/limit/5xx/network), fall back to Cloudflare Workers AI.
    let upstream: Response | null = null;
    let usedProvider: "groq" | "cloudflare" | null = null;

    if (GROQ_API_KEY) {
      try {
        const r = await fetch(GROQ_API_URL, {
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
        if (r.ok && r.body) {
          upstream = r;
          usedProvider = "groq";
        } else {
          console.warn("Groq failed, will try Cloudflare. status:", r.status);
          try { await r.body?.cancel(); } catch {}
        }
      } catch (e) {
        console.warn("Groq threw, will try Cloudflare:", e);
      }
    }

    if (!upstream && CF_TOKEN && CF_ACCOUNT) {
      try {
        const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/v1/chat/completions`;
        const r = await fetch(cfUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${CF_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: image ? CF_VISION_MODEL : CF_TEXT_MODEL,
            messages: groqMessages,
            temperature: 0.7,
            max_tokens: 2048,
            stream: true,
          }),
        });
        if (r.ok && r.body) {
          upstream = r;
          usedProvider = "cloudflare";
        } else {
          const errText = await r.text();
          console.error("Cloudflare AI error:", r.status, errText.slice(0, 300));
        }
      } catch (e) {
        console.error("Cloudflare AI threw:", e);
      }
    }

    if (!upstream) {
      return new Response(
        JSON.stringify({ error: "All AI providers unavailable. Please try again later." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI provider used:", usedProvider);
    const groqResp = upstream;

    if (!groqResp.ok) {
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
          details: errorText.slice(0, 300) 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Stream Groq's response back to client in OpenAI format
    const reader = groqResp.body?.getReader();
    if (!reader) {
      throw new Error("No response body from Groq");
    }

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
                  // Re-format as OpenAI-compatible SSE chunk
                  const chunk = {
                    choices: [{ delta: { content } }],
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                }
              } catch {
                // Partial message, put back and wait
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
        error: e instanceof Error ? e.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
