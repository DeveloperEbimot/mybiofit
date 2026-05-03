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
    const { messages, systemPrompt, extraContext, image } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const system = systemPrompt || DEFAULT_SYSTEM;
    const contextAddition = extraContext ? `\n\nAdditional context: ${extraContext}` : "";

    // Build messages for Groq (OpenAI-compatible format)
    const groqMessages = [];
    
    // Add system message
    groqMessages.push({
      role: "system",
      content: system + contextAddition,
    });

    groqMessages.push(...toGroqMessages(messages || [], image));

    // Call Groq API with streaming
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
