import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAIGate } from "@/hooks/useAIGate";

type Msg = { role: "user" | "assistant"; content: string };

export function useAIChat(promptId?: string, userContext?: string) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const gate = useAIGate(`chat:${promptId || "general"}`);

  const sendMessage = async (input: string, extraUserContext?: string) => {
    if (!gate.tryConsume()) return;
    const userMsg: Msg = { role: "user", content: input };
    const allMessages = [...messages, userMsg];
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/biofit-chat-groq`;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          ...gate.anonHeaders,
        },
        body: JSON.stringify({
          messages: allMessages,
          promptId: promptId || "general",
          userContext: extraUserContext || userContext || undefined,
        }),
      });

      if (!resp.ok || !resp.body) {
        let friendly = "Sorry, I encountered an error. Please try again.";
        try {
          const data = await resp.json();
          if (resp.status === 402) {
            friendly = "⚠️ The AI service has run out of credits for this month. Please contact support at biofit096@gmail.com so we can top it up.";
          } else if (resp.status === 429) {
            friendly = "⏳ Too many requests right now. Please wait a few seconds and try again.";
          } else if (data?.error) {
            friendly = data.error;
          }
        } catch {}
        setMessages(prev => [...prev, { role: "assistant", content: friendly }]);
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => setMessages([]);

  return { messages, isLoading, sendMessage, clearMessages, setMessages };
}
