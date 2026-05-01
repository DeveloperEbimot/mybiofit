import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Send, Mic, MicOff, Loader2, Trash2, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAIChat } from "@/hooks/useAIChat";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useGroceryList } from "@/hooks/useGroceryList";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import VoiceCallMode from "@/components/VoiceCallMode";

export default function AIChat() {
  const { profile } = useUserProfile();
  const { items: groceryItems } = useGroceryList();
  const { messages, isLoading, sendMessage, clearMessages } = useAIChat(
    `You are BioFit AI, a comprehensive health and fitness assistant. The user's profile: Diet goal: ${profile.dietGoal}, Age: ${profile.age}, Weight: ${profile.weight}kg, Height: ${profile.height}cm, Gender: ${profile.gender}, Activity: ${profile.activityLevel}. Their grocery list has: ${groceryItems.map(i => i.name).join(", ") || "nothing"}. Answer any health, nutrition, fitness, or diet question thoroughly. Use markdown formatting.`
  );
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [callMode, setCallMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Voice input is not supported in your browser. Try Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
      if (event.results[0].isFinal) {
        setIsListening(false);
        // Auto-send after voice input
        sendMessage(transcript);
        setInput("");
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Voice recognition error. Please try again.");
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    toast.info("Listening... Speak now!");
  };

  return (
    <>
    {callMode && (
      <VoiceCallMode
        systemPrompt={`You are BioFit AI in voice conversation mode. The user's profile: Diet goal: ${profile.dietGoal}, Age: ${profile.age}, Weight: ${profile.weight}kg, Height: ${profile.height}cm. Keep responses SHORT and conversational (1-3 sentences max), like a real spoken chat. Be warm, motivating, and natural. Do not use markdown, lists, or formatting — only plain spoken language.`}
        onClose={() => setCallMode(false)}
      />
    )}
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100vh - 10rem)" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">AI Chat</h1>
          <p className="text-muted-foreground text-sm">Ask me anything about health, nutrition, and fitness!</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="default"
            size="sm"
            onClick={() => setCallMode(true)}
            className="gap-2 rounded-2xl shadow-lg shadow-primary/25"
          >
            <Phone className="w-4 h-4" /> Voice Call
          </Button>
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearMessages} className="text-muted-foreground">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </motion.div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 && (
          <div className="glass-card p-12 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Hi! I'm BioFit AI. Ask me anything about:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Meal plans", "Exercise form", "Calorie counting", "Diet tips", "Recipe ideas", "Supplements"].map(t => (
                <button
                  key={t}
                  onClick={() => sendMessage(t)}
                  className="px-3 py-1.5 text-sm rounded-full bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              m.role === "user"
                ? "bg-primary text-primary-foreground"
                : "glass-card"
            }`}>
              {m.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm">{m.content}</p>
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="glass-card px-4 py-3 rounded-2xl">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant={isListening ? "default" : "outline"}
          size="icon"
          onClick={toggleVoice}
          className={isListening ? "animate-pulse-glow" : ""}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
        <Input
          placeholder="Type or use voice..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="bg-secondary border-border"
        />
        <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
    </>
  );
}
