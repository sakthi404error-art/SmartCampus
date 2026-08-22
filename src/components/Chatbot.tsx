"use client";
import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setMessages((prev) => [...prev, { text: userText, isUser: true }]);
    setInput("");
    setIsLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: "You are the Kalvium Institute AI Helpdesk. Answer student questions about syllabus, exams, and portal usage clearly and concisely.",
      });

      const result = await model.generateContent(userText);
      const text = await result.response.text();

      setMessages((prev) => [...prev, { text: text, isUser: false }]);
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages((prev) => [...prev, { text: "Sorry, I am having trouble connecting right now. Check your API key!", isUser: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-2xl w-80 h-96 flex flex-col border border-gray-200 overflow-hidden">
          <div className="bg-indigo-600 text-white p-3 flex justify-between items-center">
            <h3 className="font-semibold text-sm">AI Helpdesk</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200 transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-xs text-gray-500 text-center mt-4">Ask me anything about the portal!</div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`p-2 rounded-lg text-sm max-w-[85%] ${msg.isUser ? "bg-indigo-600 text-white self-end" : "bg-gray-200 text-gray-800 self-start"}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && <div className="text-xs text-gray-500 self-start animate-pulse">Typing...</div>}
          </div>
          <div className="p-3 border-t flex gap-2 bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your question..."
              className="flex-1 border rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-600"
            />
            <button onClick={handleSend} className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 transition-colors">
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-105"
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
}