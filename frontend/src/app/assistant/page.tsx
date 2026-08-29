"use client";

import { useState } from "react";
import AppShell from "../components/AppShell";

type Message = {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
};

const initialMessages: Message[] = [
  {
    id: "1",
    sender: "assistant",
    text: "Namaste! I am your AgriProfit AI Agronomist. I have access to your farm boundaries, regional weather forecasts, and live mandi prices. How can I assist your crop planning today?",
    timestamp: "10:30 AM",
  },
];

const sampleQuestions = [
  "What fertilizer dose is recommended for Wheat at CRI stage?",
  "How should I manage my field ahead of Sunday's rain forecast?",
  "Is Mustard more profitable than Wheat at current Bathinda mandi rates?",
  "What are the symptoms of Yellow Rust in wheat and how to treat it?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSend(questionText?: string) {
    const textToSend = questionText || input;
    if (!textToSend.trim()) return;

    const userTime = "Just now";
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-user-${prev.length + 1}`,
        sender: "user",
        text: textToSend,
        timestamp: userTime,
      },
    ]);

    if (!questionText) setInput("");
    setLoading(true);

    setTimeout(() => {
      let reply = "Based on your farm profile and ICAR package of practices, ensure balanced NPK ratio and soil moisture before applying top-dressing.";
      const lower = textToSend.toLowerCase();

      if (lower.includes("rain") || lower.includes("weather")) {
        reply = "With 18.5mm of rain forecast for Sunday in your region, avoid nitrogen top-dressing and chemical foliar sprays for 48 hours to prevent runoff losses. Check drainage pathways in low-lying sections.";
      } else if (lower.includes("fertilizer") || lower.includes("cri") || lower.includes("wheat")) {
        reply = "For Wheat at Crown Root Initiation (CRI) stage (20–25 days after sowing), apply the first top-dressing of Urea (around 30–35 kg/acre) followed immediately by light irrigation. Ensure soil has adequate moisture.";
      } else if (lower.includes("mustard") || lower.includes("profit") || lower.includes("price")) {
        reply = "Mustard is currently trading at ₹5,650/q in Bathinda with strong oilseed demand, yielding an estimated net profit of ₹26,500/acre. Wheat offers ₹24,000/acre at MSP floor (₹2,275/q). A 60:40 allocation balances profit upside with MSP price floor protection.";
      } else if (lower.includes("rust") || lower.includes("disease")) {
        reply = "Yellow rust appears as yellow-orange stripes on upper leaf surfaces. If detected, spray Propiconazole 25% EC (Tilt) @ 1 ml/litre of water during clear sunny weather. Avoid spraying when rain is imminent.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-bot-${prev.length + 1}`,
          sender: "assistant",
          text: reply,
          timestamp: "Just now",
        },
      ]);
      setLoading(false);
    }, 600);
  }

  return (
    <AppShell pageTitle="AI crop assistant">
      <section className="page-wrap feature-page flex flex-col h-[calc(100vh-120px)]">
        <header className="feature-header mb-3">
          <p className="eyebrow">AGRONOMIC AI ADVISOR</p>
          <h1>Farm & Crop Stage Assistant</h1>
          <p className="subhead">Context-aware advice combining your farm location, soil data, and local weather forecasts.</p>
        </header>

        {/* Chat History Panel */}
        <section className="panel flex-1 overflow-y-auto space-y-3 mb-3 p-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                  m.sender === "user"
                    ? "bg-emerald-800 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none border"
                }`}
              >
                <div className="flex justify-between items-center gap-4 mb-1">
                  <strong className="text-[10px] uppercase tracking-wider opacity-75">
                    {m.sender === "user" ? "You" : "AgriProfit AI"}
                  </strong>
                  <span className="text-[9px] opacity-60">{m.timestamp}</span>
                </div>
                <p>{m.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-500 rounded-xl px-4 py-2 text-xs">AI Agronomist is analyzing...</div>
            </div>
          )}
        </section>

        {/* Quick Suggested Prompts */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2">
          {sampleQuestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleSend(q)}
              className="text-[11px] bg-white border border-gray-200 hover:border-emerald-600 px-3 py-1.5 rounded-full whitespace-nowrap text-gray-700 transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about fertilizer, pest control, weather risks, or market prices..."
            className="flex-1 p-2.5 border rounded-lg text-xs bg-white focus:outline-emerald-700"
          />
          <button type="submit" disabled={!input.trim()} className="primary-button text-xs px-5 py-2.5">
            Ask Assistant
          </button>
        </form>

        <p className="text-[10px] text-gray-400 text-center mt-2">
          AI guidance is advisory. Always cross-check with local university extension specialists for chemical dosages.
        </p>
      </section>
    </AppShell>
  );
}