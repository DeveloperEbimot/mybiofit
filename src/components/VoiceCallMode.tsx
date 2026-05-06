import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneOff, Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAIGate } from "@/hooks/useAIGate";

type Status = "idle" | "listening" | "thinking" | "speaking";
type Turn = { role: "user" | "assistant"; content: string };

interface Props {
  userContext?: string;
  onClose: () => void;
}

// Browser Web Speech APIs do NOT exist in Android WebView (Median, Capacitor, etc).
// We detect that and fall back to a server pipeline:
//   MediaRecorder -> Groq Whisper (STT) -> chat -> Groq PlayAI (TTS) -> <audio>
const hasBrowserSTT = () =>
  typeof window !== "undefined" &&
  ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
const hasBrowserTTS = () =>
  typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

export default function VoiceCallMode({ userContext, onClose }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const gate = useAIGate("voice_call");
  const [transcript, setTranscript] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [muted, setMuted] = useState(false);
  const [history, setHistory] = useState<Turn[]>([]);

  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isActiveRef = useRef(true);
  const historyRef = useRef<Turn[]>([]);

  // Server-fallback refs
  const useServerVoiceRef = useRef(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => { historyRef.current = history; }, [history]);

  useEffect(() => {
    const browserOk = hasBrowserSTT() && hasBrowserTTS();
    useServerVoiceRef.current = !browserOk;

    if (!browserOk && !navigator.mediaDevices?.getUserMedia) {
      toast.error("Voice chat needs microphone access. Please use a supported browser or app.");
      onClose();
      return;
    }

    const greeting = "Hi! I'm here. What would you like to talk about — recipes, workouts, or anything fitness?";
    setLastReply(greeting);
    speak(greeting);

    return () => {
      isActiveRef.current = false;
      cleanupAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanupAudio = () => {
    try { recognitionRef.current?.stop(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
    try { recorderRef.current?.stop(); } catch {}
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    try { audioContextRef.current?.close(); } catch {}
    audioContextRef.current = null;
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = "";
    }
  };

  // ---------- SPEAK ----------
  const speak = async (text: string) => {
    if (!isActiveRef.current) return;
    if (muted) { startListening(); return; }
    setStatus("speaking");

    if (!useServerVoiceRef.current && hasBrowserTTS()) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find((v) => /Google|Samantha|Karen|Microsoft.*Aria/i.test(v.name) && v.lang.startsWith("en"));
      if (preferred) utterance.voice = preferred;
      utterance.onend = () => isActiveRef.current && startListening();
      utterance.onerror = () => isActiveRef.current && startListening();
      utteranceRef.current = utterance;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      return;
    }

    // Server TTS via Groq PlayAI
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/biofit-voice?mode=tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          ...gate.anonHeaders,
        },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) throw new Error("tts http " + resp.status);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      if (!audioElRef.current) audioElRef.current = new Audio();
      const a = audioElRef.current;
      a.src = url;
      a.onended = () => { URL.revokeObjectURL(url); isActiveRef.current && startListening(); };
      a.onerror = () => { URL.revokeObjectURL(url); isActiveRef.current && startListening(); };
      await a.play();
    } catch (e) {
      console.warn("Server TTS failed, listening anyway", e);
      if (isActiveRef.current) startListening();
    }
  };

  // ---------- LISTEN ----------
  const startListening = () => {
    if (!isActiveRef.current) return;
    setStatus("listening");
    setTranscript("");

    if (!useServerVoiceRef.current && hasBrowserSTT()) {
      startBrowserListening();
    } else {
      startServerListening();
    }
  };

  const startBrowserListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalText = "";
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t; else interim += t;
      }
      setTranscript(finalText + interim);
    };
    recognition.onerror = (e: any) => {
      if (e.error === "not-allowed") { toast.error("Microphone permission denied."); onClose(); return; }
      if (isActiveRef.current) setTimeout(() => isActiveRef.current && startListening(), 500);
    };
    recognition.onend = () => {
      const said = finalText.trim();
      if (!isActiveRef.current) return;
      if (said.length < 2) { setTimeout(() => isActiveRef.current && startListening(), 200); return; }
      handleUserSaid(said);
    };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch { setTimeout(() => isActiveRef.current && startListening(), 300); }
  };

  // Server STT path: record mic, auto-stop on ~1.2s of silence, send to Whisper.
  const startServerListening = async () => {
    try {
      if (!mediaStreamRef.current) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      const stream = mediaStreamRef.current;

      // Pick a supported mime type
      const mimeCandidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
      const mimeType = mimeCandidates.find((m) => (window as any).MediaRecorder?.isTypeSupported?.(m)) || "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
        if (!isActiveRef.current) return;
        if (blob.size < 2000) { // too short, restart
          setTimeout(() => isActiveRef.current && startListening(), 150);
          return;
        }
        await transcribeAndAnswer(blob, mimeType);
      };

      // Silence detection via Web Audio analyser
      try {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        analyserRef.current = analyser;
        const data = new Uint8Array(analyser.fftSize);
        const startedAt = Date.now();
        let lastVoiceAt = Date.now();
        let everSpoke = false;
        const tick = () => {
          if (!isActiveRef.current || recorder.state !== "recording") return;
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
          const rms = Math.sqrt(sum / data.length);
          const now = Date.now();
          if (rms > 0.04) { lastVoiceAt = now; everSpoke = true; }
          const elapsed = now - startedAt;
          const silentFor = now - lastVoiceAt;
          // Stop if user spoke and then went silent ~1.2s, OR no voice at all for 6s, OR hard cap 20s
          if ((everSpoke && silentFor > 1200) || (!everSpoke && elapsed > 6000) || elapsed > 20000) {
            try { recorder.stop(); } catch {}
            return;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (e) {
        // If analyser fails, just record for 5s flat
        silenceTimerRef.current = window.setTimeout(() => { try { recorder.stop(); } catch {} }, 5000);
      }

      recorder.start();
    } catch (e) {
      console.error("mic error", e);
      toast.error("Microphone permission denied.");
      onClose();
    }
  };

  const transcribeAndAnswer = async (blob: Blob, mimeType: string) => {
    if (!gate.tryConsume()) {
      const msg = "You've used your free voice tries. Sign up free to keep talking.";
      setLastReply(msg); speak(msg); return;
    }
    setStatus("thinking");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const fd = new FormData();
      const ext = (mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm";
      fd.append("file", blob, `audio.${ext}`);
      const sttResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/biofit-voice?mode=stt`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}`, ...gate.anonHeaders },
        body: fd,
      });
      if (!sttResp.ok) throw new Error("stt failed");
      const { text } = await sttResp.json();
      const said = (text || "").trim();
      if (said.length < 2) { setTimeout(() => isActiveRef.current && startListening(), 200); return; }
      setTranscript(said);
      await handleUserSaid(said, /*alreadyConsumed*/ true);
    } catch (e) {
      console.error(e);
      const msg = "Sorry, I couldn't hear that. Try again.";
      setLastReply(msg); speak(msg);
    }
  };

  // ---------- CHAT ----------
  const handleUserSaid = async (text: string, alreadyConsumed = false) => {
    if (!alreadyConsumed && !gate.tryConsume()) {
      const msg = "You've used your free voice tries. Sign up free to keep talking.";
      setLastReply(msg); speak(msg); return;
    }
    setStatus("thinking");
    setTranscript(text);
    const newHistory: Turn[] = [...historyRef.current, { role: "user", content: text }];
    setHistory(newHistory);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/biofit-chat-groq`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          ...gate.anonHeaders,
        },
        body: JSON.stringify({ messages: newHistory, promptId: "voice", userContext }),
      });

      if (!resp.ok || !resp.body) {
        let friendly = "Sorry, I had trouble responding. Could you try again?";
        try {
          const data = await resp.json();
          if (resp.status === 402) friendly = "The A.I. service has run out of credits this month. Please contact support to top it up.";
          else if (resp.status === 429) friendly = "Too many requests right now. Please wait a few seconds.";
          else if (data?.error) friendly = data.error;
        } catch {}
        setLastReply(friendly);
        setHistory((h) => [...h, { role: "assistant", content: friendly }]);
        speak(friendly);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = ""; let result = "";
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
          if (json === "[DONE]") break;
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) result += c;
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
      const reply = result.trim() || "Sorry, I didn't catch that.";
      setHistory((h) => [...h, { role: "assistant", content: reply }]);
      setLastReply(reply);
      speak(reply);
    } catch (err) {
      console.error(err);
      const fallback = "Sorry, I had trouble responding. Could you try again?";
      setLastReply(fallback);
      speak(fallback);
    }
  };

  const handleClose = () => { isActiveRef.current = false; cleanupAudio(); onClose(); };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      if (next) { try { window.speechSynthesis?.cancel(); } catch {}; audioElRef.current?.pause(); }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-2xl flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Voice Call</p>
          <p className="font-display text-lg font-bold">BioFit AI</p>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleMute} aria-label="Toggle mute speaker">
          {muted ? <MicOff className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
        <motion.div
          animate={
            status === "listening" ? { scale: [1, 1.15, 1] } :
            status === "speaking" ? { scale: [1, 1.08, 1] } :
            status === "thinking" ? { rotate: 360 } : { scale: 1 }
          }
          transition={{ duration: status === "thinking" ? 2 : 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/40 relative"
        >
          {status === "listening" && (
            <>
              <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
              <span className="absolute inset-2 rounded-full bg-primary/20 animate-ping" style={{ animationDelay: "0.4s" }} />
            </>
          )}
          {status === "thinking" ? <Loader2 className="w-16 h-16 text-primary-foreground animate-spin" /> :
           status === "speaking" ? <Volume2 className="w-16 h-16 text-primary-foreground" /> :
           <Mic className="w-16 h-16 text-primary-foreground relative z-10" />}
        </motion.div>

        <div className="min-h-[80px]">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            {status === "listening" && "Listening..."}
            {status === "thinking" && "Thinking..."}
            {status === "speaking" && "Speaking..."}
            {status === "idle" && "Connecting..."}
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={status + (transcript || lastReply)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-base text-foreground/90 max-w-md leading-relaxed line-clamp-4"
            >
              {status === "listening" && transcript ? `"${transcript}"` :
               status === "speaking" || status === "thinking" ? lastReply : ""}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="p-6 flex justify-center">
        <Button onClick={handleClose} size="lg" variant="destructive" className="rounded-full w-16 h-16 shadow-xl" aria-label="End call">
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
