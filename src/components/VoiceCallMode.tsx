import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneOff, Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Status = "idle" | "listening" | "thinking" | "speaking";
type Turn = { role: "user" | "assistant"; content: string };

interface Props {
  systemPrompt: string;
  onClose: () => void;
}

export default function VoiceCallMode({ systemPrompt, onClose }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [lastReply, setLastReply] = useState("");
  const [muted, setMuted] = useState(false);
  const [history, setHistory] = useState<Turn[]>([]);

  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isActiveRef = useRef(true);
  const historyRef = useRef<Turn[]>([]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  // Voice support check
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice chat needs Chrome, Edge, or Safari with mic access.");
      onClose();
      return;
    }
    if (!("speechSynthesis" in window)) {
      toast.error("Speech synthesis not supported in your browser.");
      onClose();
      return;
    }
    // Start the conversation: greeting from AI
    const greeting = "Hi! I'm here. What would you like to talk about — recipes, workouts, or anything fitness?";
    setLastReply(greeting);
    speakAndListen(greeting);

    return () => {
      isActiveRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speakAndListen = (text: string) => {
    if (!isActiveRef.current) return;
    if (muted) {
      // Skip TTS, jump straight to listening
      startListening();
      return;
    }
    setStatus("speaking");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    // Pick a clear English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => /Google|Samantha|Karen|Microsoft.*Aria/i.test(v.name) && v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => {
      if (!isActiveRef.current) return;
      startListening();
    };
    utterance.onerror = () => {
      if (!isActiveRef.current) return;
      startListening();
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!isActiveRef.current) return;
    setStatus("listening");
    setTranscript("");

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalText = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += text;
        else interim += text;
      }
      setTranscript(finalText + interim);
    };

    recognition.onerror = (e: any) => {
      console.warn("Recognition error:", e.error);
      if (e.error === "no-speech" || e.error === "aborted") {
        // Quietly retry
        if (isActiveRef.current) setTimeout(() => isActiveRef.current && startListening(), 500);
      } else if (e.error === "not-allowed") {
        toast.error("Microphone permission denied.");
        onClose();
      } else {
        if (isActiveRef.current) setTimeout(() => isActiveRef.current && startListening(), 500);
      }
    };

    recognition.onend = () => {
      const said = finalText.trim();
      if (!isActiveRef.current) return;
      if (said.length < 2) {
        // Not enough; keep listening
        setTimeout(() => isActiveRef.current && startListening(), 200);
        return;
      }
      handleUserSaid(said);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setTimeout(() => isActiveRef.current && startListening(), 300);
    }
  };

  const handleUserSaid = async (text: string) => {
    setStatus("thinking");
    setTranscript(text);
    const newHistory: Turn[] = [...historyRef.current, { role: "user", content: text }];
    setHistory(newHistory);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/biofit-chat-groq`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newHistory,
          systemPrompt,
        }),
      });

      if (!resp.ok || !resp.body) {
        let friendly = "Sorry, I had trouble responding. Could you try again?";
        try {
          const data = await resp.json();
          if (resp.status === 402) {
            friendly = "The A.I. service has run out of credits this month. Please contact support to top it up.";
          } else if (resp.status === 429) {
            friendly = "Too many requests right now. Please wait a few seconds.";
          } else if (data?.error) {
            friendly = data.error;
          }
        } catch {}
        setLastReply(friendly);
        setHistory((h) => [...h, { role: "assistant", content: friendly }]);
        speakAndListen(friendly);
        return;
      }

      // Read full stream then speak
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result = "";
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
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      const reply = result.trim() || "Sorry, I didn't catch that.";
      setHistory((h) => [...h, { role: "assistant", content: reply }]);
      setLastReply(reply);
      speakAndListen(reply);
    } catch (err) {
      console.error(err);
      const fallback = "Sorry, I had trouble responding. Could you try again?";
      setLastReply(fallback);
      speakAndListen(fallback);
    }
  };

  const handleClose = () => {
    isActiveRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    window.speechSynthesis.cancel();
    onClose();
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      if (next) window.speechSynthesis.cancel();
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Voice Call</p>
          <p className="font-display text-lg font-bold">BioFit AI</p>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleMute} aria-label="Toggle mute speaker">
          {muted ? <MicOff className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </div>

      {/* Visualizer */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
        <motion.div
          animate={
            status === "listening"
              ? { scale: [1, 1.15, 1] }
              : status === "speaking"
              ? { scale: [1, 1.08, 1] }
              : status === "thinking"
              ? { rotate: 360 }
              : { scale: 1 }
          }
          transition={{
            duration: status === "thinking" ? 2 : 1.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/40 relative"
        >
          {status === "listening" && (
            <>
              <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
              <span className="absolute inset-2 rounded-full bg-primary/20 animate-ping" style={{ animationDelay: "0.4s" }} />
            </>
          )}
          {status === "thinking" ? (
            <Loader2 className="w-16 h-16 text-primary-foreground animate-spin" />
          ) : status === "speaking" ? (
            <Volume2 className="w-16 h-16 text-primary-foreground" />
          ) : (
            <Mic className="w-16 h-16 text-primary-foreground relative z-10" />
          )}
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
               status === "speaking" || status === "thinking" ? lastReply :
               ""}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* End call */}
      <div className="p-6 flex justify-center">
        <Button
          onClick={handleClose}
          size="lg"
          variant="destructive"
          className="rounded-full w-16 h-16 shadow-xl"
          aria-label="End call"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}