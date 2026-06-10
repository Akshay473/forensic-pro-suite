"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Loader2, Trash2 } from "lucide-react";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function RobotAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "Investigator, I am your Forensic AI Assistant. How can I guide you through the Forensic Pro Suite today?" }
  ]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("forensic_chat_history");
    if (saved) {
      try {
        const history = JSON.parse(saved);
        requestAnimationFrame(() => {
          setMessages(history);
        });
      } catch {
        // fail silently
      }
    }
    requestAnimationFrame(() => {
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (messages.length === 1 && messages[0].content === "Investigator, I am your Forensic AI Assistant. How can I guide you through the Forensic Pro Suite today?") {
        localStorage.removeItem("forensic_chat_history");
      } else {
        const capped = messages.slice(-50);
        localStorage.setItem("forensic_chat_history", JSON.stringify(capped));
      }
    } catch {
      // fail silently
    }
  }, [messages, isLoaded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: "model", content: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: "model", content: "I encountered an error connecting to the intelligence network. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            className="fixed bottom-24 right-8 w-72 sm:w-80 bg-slate-900 border-2 border-emerald-500 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)] z-50 flex flex-col overflow-hidden"
            style={{ height: "400px", maxHeight: "80vh" }}
          >
            {/* Header */}
            <div className="bg-slate-800 p-4 border-b border-emerald-500/30 flex justify-between items-center">
              <div className="flex items-center gap-2 text-emerald-400">
                <Bot className="w-5 h-5" />
                <h4 className="font-bold text-sm uppercase tracking-widest">AI Assistant</h4>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const welcome: Message[] = [
                      { role: "model", content: "Investigator, I am your Forensic AI Assistant. How can I guide you through the Forensic Pro Suite today?" }
                    ];
                    setMessages(welcome);
                    try {
                      localStorage.removeItem("forensic_chat_history");
                    } catch {
                      // fail silently
                    }
                  }}
                  aria-label="Clear chat history"
                  title="Clear Chat"
                  className="text-slate-400 hover:text-white transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div 
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.role === "user" 
                        ? "bg-emerald-600 text-white rounded-tr-sm" 
                        : "bg-slate-800 text-slate-200 border border-emerald-500/20 rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-emerald-500/20 p-3 rounded-2xl rounded-tl-sm text-emerald-400 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Analyzing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-800/50 border-t border-emerald-500/30">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask for guidance..."
                  aria-label="Chat message input"
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition shadow-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="bg-emerald-600 p-2 rounded-lg text-white hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
        role="button"
        className="fixed bottom-6 right-8 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-2xl shadow-[0_0_25px_rgba(16,185,129,0.6)] cursor-pointer z-50"
      >
        <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
      </motion.div>
    </>
  );
}