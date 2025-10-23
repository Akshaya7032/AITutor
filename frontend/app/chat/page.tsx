"use client";

import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

type ScenarioKey = "restaurant" | "travel" | "interview" | "emergency";
type ConvItem = { role: "user" | "assistant"; content: string };

// Hardcoded API key
const API_KEY =
  "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const SCENARIOS: Record<ScenarioKey, { role: string; system: string; start: string }> = {
  restaurant: {
    role: "French Waiter",
    system:
      "You are a polite waiter in a Paris café. Speak naturally in English with French phrases. Keep responses short (1-2 sentences). Advance the ordering conversation.",
    start: "Bonjour! Welcome to Café de Paris. Table for how many, please?",
  },
  travel: {
    role: "Japanese Receptionist",
    system:
      "You are a helpful hotel receptionist in Tokyo. Speak professionally in English. Keep responses concise. Guide through booking process.",
    start: "Konnichiwa! Welcome to Tokyo Grand Hotel. How may I help with your reservation?",
  },
  interview: {
    role: "Tech Interviewer",
    system:
      "You are a professional tech interviewer. Ask behavioral and technical questions. Give 1-2 sentence responses. Be encouraging but professional.",
    start:
      "Hello! Thanks for interviewing for our Senior Developer role. Tell me about your experience with React.",
  },
  emergency: {
    role: "Emergency Operator",
    system:
      "You are a calm emergency operator. Ask critical questions efficiently. Use short, clear responses. Prioritize location and situation details.",
    start: "Emergency services. What's your emergency?",
  },
};

export default function RoleplayPage() {
  const [scenario, setScenario] = useState<ScenarioKey | "">("");
  const [conversation, setConversation] = useState<ConvItem[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [statusText, setStatusText] = useState("Click & speak your response!");
  const [debugText, setDebugText] = useState("");
  const [fallbackValue, setFallbackValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const speechBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    synthesisRef.current = window.speechSynthesis ?? null;
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
    if (SR) {
      const r = new SR();
      r.continuous = false;
      r.interimResults = false;
      r.lang = "en-US";
      r.onend = () => setIsListening(false);
      recognitionRef.current = r;
      setDebugText("Speech ready! Speak clearly.");
    } else {
      setDebugText("Speech not supported - using typing fallback.");
    }
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversation, evaluation]);

  const resetSpeechBtn = () => {
    if (speechBtnRef.current) {
      speechBtnRef.current.className = "";
      speechBtnRef.current.textContent = "🎤 Speak";
    }
  };

  function speakText(text: string) {
    if (!synthesisRef.current) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    synthesisRef.current.cancel();
    synthesisRef.current.speak(utterance);
    if (speechBtnRef.current) {
      speechBtnRef.current.className = "speaking";
      speechBtnRef.current.textContent = "🔊";
    }
    utterance.onend = () => resetSpeechBtn();
  }

  function addMessage(role: ConvItem["role"], text: string) {
    setConversation((prev) => [...prev, { role, content: text }]);
  }

  async function callOpenRouterAPI(userMessage: string, isEval: boolean) {
    const system = scenario ? SCENARIOS[scenario].system : "";
    const recent = conversation.slice(-8).map((c) => ({
      role: c.role === "assistant" ? "assistant" : "user",
      content: c.content,
    }));
    const messages = [{ role: "system", content: system }, ...recent, { role: "user", content: userMessage }];
    const body = {
      model: "anthropic/claude-3.5-sonnet",
      messages,
      max_tokens: isEval ? 200 : 120,
      temperature: isEval ? 0.2 : 0.7,
    };
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" } as any,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return String(data?.choices?.[0]?.message?.content ?? "").trim();
  }

  async function processSpeech(message: string) {
    setLoading(true);
    try {
      const aiResponse = await callOpenRouterAPI(message, false);
      setTurnCount((t) => t + 1);
      addMessage("assistant", aiResponse);
      speakText(aiResponse);
      setStatusText("Click & speak your response!");
    } catch (err: any) {
      console.error(err);
      addMessage("assistant", `❌ API Error`);
    } finally {
      setLoading(false);
    }
  }

  function startRoleplay() {
    if (!scenario) return alert("Please select a scenario.");
    setConversation([]);
    setTurnCount(0);
    setEvaluation(null);
    setIsPlaying(true);
    setStatusText("Click & speak your response!");
    addMessage("assistant", SCENARIOS[scenario].start);
    speakText(SCENARIOS[scenario].start);
  }

  function startListening() {
    if (!recognitionRef.current) return;
    try {
      const rec = recognitionRef.current;
      setIsListening(true);
      if (speechBtnRef.current) {
        speechBtnRef.current.className = "listening";
        speechBtnRef.current.textContent = "🔴";
      }
      setStatusText("Listening... Speak now!");
      rec.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript.trim();
        if (transcript.toLowerCase() === "end" || transcript.toLowerCase() === "finish") {
          endRoleplay();
          return;
        }
        addMessage("user", transcript);
        setConversation((prev) => [...prev, { role: "user", content: transcript }]);
        processSpeech(transcript);
        resetSpeechBtn();
        setIsListening(false);
      };
      rec.onerror = (event: any) => {
        console.error("Speech error:", event);
        setDebugText("Error: " + (event?.error ?? "unknown"));
        resetSpeechBtn();
        setIsListening(false);
      };
      rec.start();
    } catch (err) {
      console.error("Start error:", err);
      resetSpeechBtn();
      setIsListening(false);
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
    resetSpeechBtn();
  }

  function processFallback() {
    const text = fallbackValue.trim();
    if (!text) return;
    setFallbackValue("");
    if (text.toLowerCase() === "end" || text.toLowerCase() === "finish") {
      endRoleplay();
      return;
    }
    addMessage("user", text);
    setConversation((prev) => [...prev, { role: "user", content: text }]);
    processSpeech(text);
  }

  async function endRoleplay() {
    setIsPlaying(false);
    setStatusText("Roleplay ended. Evaluating...");
    setLoading(true);
    try {
      const evalPrompt = `
Analyze this ${turnCount}-turn SPOKEN conversation:
FLUENCY: Pronunciation, grammar, natural flow (0-10)
RELEVANCE: Staying on topic, advancing scenario (0-10)
POLITENESS: Courtesy, tone, clarity (0-10)

Conversation: ${JSON.stringify(conversation)}

Respond ONLY with:
FLUENCY: X
RELEVANCE: Y
POLITENESS: Z
FEEDBACK: [1-sentence spoken English tip]
LENGTH: Great/Good/Fair
      `;
      const evalResp = await callOpenRouterAPI(evalPrompt, true);
      setEvaluation(evalResp);
      speakText(
        `Evaluation complete. ${evalResp
          .replace(/FLUENCY:/g, "Fluency:")
          .replace(/RELEVANCE:/g, "Relevance:")
          .replace(/POLITENESS:/g, "Politeness:")}`
      );
    } catch (err) {
      console.error(err);
      setEvaluation("Evaluation failed due to API error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>🎤 Roleplay AI</h1>

      <div className="controls">
        <select value={scenario} onChange={(e) => setScenario(e.target.value as ScenarioKey)}>
          <option value="">-- Select Scenario --</option>
          <option value="restaurant">Restaurant</option>
          <option value="travel">Travel</option>
          <option value="interview">Interview</option>
          <option value="emergency">Emergency</option>
        </select>
        <button onClick={startRoleplay} disabled={!scenario || isPlaying}>
          Start
        </button>
        <button onClick={endRoleplay} disabled={!isPlaying}>
          End
        </button>
      </div>

      <div className="chat-container" ref={chatContainerRef}>
        {conversation.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            <span className="role">{m.role === "user" ? "You" : "AI"}</span>
            <span className="content">{m.content}</span>
          </div>
        ))}
      </div>

      {isPlaying && (
        <div className="input-section">
          <button ref={speechBtnRef} onClick={() => (isListening ? stopListening() : startListening())}>
            {isListening ? "🔴 Listening..." : "🎤 Speak"}
          </button>
          <input
            value={fallbackValue}
            onChange={(e) => setFallbackValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && processFallback()}
            placeholder="Or type here..."
          />
          <div className="status">{statusText}</div>
          <div className="debug">{debugText}</div>
        </div>
      )}
      {loading && <div className="loading">⏳ AI is thinking...</div>}

      {evaluation && (
        <div className="evaluation">
          <h2>📊 Session Evaluation</h2>
          <pre>{evaluation}</pre>
          <button onClick={startRoleplay}>New Session</button>
        </div>
      )}

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 40px auto;
          padding: 20px;
          font-family: "Segoe UI", sans-serif;
          background: #fefefe;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        h1 {
          text-align: center;
          margin-bottom: 20px;
        }
        .controls {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 15px;
        }
        select,
        button {
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid #ccc;
          cursor: pointer;
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .chat-container {
          max-height: 400px;
          overflow-y: auto;
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 8px;
          margin-bottom: 12px;
          background: #f8f8f8;
        }
        .message {
          margin-bottom: 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .message.user .content {
          background: #007bff;
          color: white;
          align-self: flex-end;
          border-radius: 12px;
          padding: 8px 12px;
        }
        .message.assistant .content {
          background: #6c757d;
          color: white;
          align-self: flex-start;
          border-radius: 12px;
          padding: 8px 12px;
        }
        .role {
          font-size: 12px;
          color: #555;
        }
        .input-section {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .input-section input {
          flex: 1;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #ccc;
        }
        .status {
          text-align: center;
          font-size: 14px;
          margin-top: 5px;
        }
        .debug {
          text-align: center;
          font-size: 12px;
          color: red;
        }
        .loading {
          text-align: center;
          font-style: italic;
          margin-top: 10px;
        }
        .evaluation {
          margin-top: 20px;
          padding: 12px;
          border-radius: 10px;
          background: #e8f5e9;
        }
        .evaluation pre {
          white-space: pre-wrap;
        }
        .speaking {
          background: #ffe66d !important;
        }
        .listening {
          background: #4ecdc4 !important;
        }
      `}</style>
    </div>
  );
}
