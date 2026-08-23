"use client";

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', content: 'Hi! I am Nexus AI. I can help you with ERP modules, business logic, or campus queries.' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // 🚀 SECURED: Uses Vercel Environment Variables instead of plain text!
  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY; 

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);

    if (!GEMINI_API_KEY) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', content: "⚠️ System Error: API Key missing from Vercel Environment Variables." }]);
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are Nexus AI, an assistant for ISSM Business School students. Answer concisely and professionally. User asks: ${userMsg}` }] }]
        })
      });

      const data = await response.json();
      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble processing that right now.";
      
      setMessages(prev => [...prev, { role: 'ai', content: aiReply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Network error. Please check your API key and connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="flex h-[500px] w-80 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between bg-slate-900 p-4 text-white">
            <div className="flex items-center gap-2 font-bold"><Sparkles className="h-5 w-5 text-indigo-400"/> Nexus AI</div>
            <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white"><X className="h-5 w-5"/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && <div className="flex justify-start"><div className="rounded-2xl rounded-bl-none bg-white border border-slate-200 px-4 py-2 shadow-sm"><Loader2 className="h-4 w-4 animate-spin text-indigo-600"/></div></div>}
            <div ref={endOfMessagesRef} />
          </div>

          <div className="border-t border-slate-100 bg-white p-3">
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask Nexus..." className="flex-1 bg-transparent text-sm outline-none" />
              <button onClick={handleSend} disabled={isLoading || !input.trim()} className="text-indigo-600 disabled:opacity-50"><Send className="h-5 w-5"/></button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl hover:scale-105 transition-transform"><MessageSquare className="h-6 w-6"/></button>
      )}
    </div>
  );
}