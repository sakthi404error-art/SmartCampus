"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Sparkles } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "bot", content: "Hi! I'm Nexus, your ISSM campus assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const botMessage: Message = { id: (Date.now() + 1).toString(), role: "bot", content: data.reply };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      const errorMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: "bot", 
        content: "I'm having trouble connecting to the campus network right now. Please try again in a moment." 
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${isOpen ? "hidden" : "flex"}`}
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between bg-indigo-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <div>
                <h3 className="font-semibold text-sm">Nexus AI</h3>
                <p className="text-[10px] text-indigo-200">ISSM Business School Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 transition hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Message Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-none border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="border-t border-slate-100 bg-white p-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-2 py-1.5 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Nexus..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}