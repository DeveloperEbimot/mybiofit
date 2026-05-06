import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-biofit-anon-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Server-side voice helper for WebView/Median apps where the browser
// SpeechRecognition / SpeechSynthesis APIs are unavailable.
//
// Modes:
//   mode=stt  -> multipart form with `file` (audio blob). Returns { text }.
//   mode=tts  -> JSON { text, voice? }. Returns audio/wav bytes.

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Auth: signed-in or anon (with stable id, same as chat function). ---
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice("Bearer ".length);
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
    let isAuthed = false;
    // Only attempt user lookup if it's not the anon/publishable key (those are not user JWTs).
    if (token && token !== anonKey && token !== publishableKey) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          anonKey,
        );
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user?.id) isAuthed = true;
      } catch (_e) {
        isAuthed = false;
      }
    }
    if (!isAuthed) {
      const anonId = req.headers.get("x-biofit-anon-id") || "";
      if (!anonId || anonId.length < 8 || anonId.length > 64) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "stt";

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "Voice service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "stt") {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return new Response(JSON.stringify({ error: "file is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // 25 MB hard cap (Groq limit is around this).
      if (file.size > 25 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: "audio too large" }), {
          status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const fd = new FormData();
      fd.append("file", file, file.name || "audio.webm");
      fd.append("model", "whisper-large-v3-turbo");
      fd.append("response_format", "json");
      fd.append("language", "en");

      const r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        body: fd,
      });
      if (!r.ok) {
        const errText = await r.text();
        console.error("STT error", r.status, errText.slice(0, 300));
        return new Response(JSON.stringify({ error: "Transcription failed" }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await r.json();
      return new Response(JSON.stringify({ text: data.text || "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "tts") {
      const body = await req.json();
      const text: string = (body?.text || "").toString().slice(0, 1500);
      const voice: string = (body?.voice || "Celeste-PlayAI").toString();
      if (!text.trim()) {
        return new Response(JSON.stringify({ error: "text is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const r = await fetch("https://api.groq.com/openai/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "playai-tts",
          input: text,
          voice,
          response_format: "wav",
        }),
      });
      if (!r.ok) {
        const errText = await r.text();
        console.error("TTS error", r.status, errText.slice(0, 300));
        return new Response(JSON.stringify({ error: "Speech synthesis failed" }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const audio = await r.arrayBuffer();
      return new Response(audio, {
        headers: { ...corsHeaders, "Content-Type": "audio/wav" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown mode" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Voice error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});