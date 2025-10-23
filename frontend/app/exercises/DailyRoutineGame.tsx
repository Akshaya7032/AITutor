"use client";

import React, { useEffect, useRef, useState } from "react";

export default function DailyRoutineGame() {
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("Click → Talk 30 seconds!");
  const [transcript, setTranscript] = useState("");
  const [displayTranscript, setDisplayTranscript] = useState("Your words will appear here...");
  const [timeLeft, setTimeLeft] = useState(30);
  const [scoreText, setScoreText] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>(""); // holds accumulated final results
  const interimRef = useRef<string>(""); // holds latest interim
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Init speech recognition
    const win = window as any;
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) {
      setStatus("❌ Speech Recognition not supported in this browser. Use Chrome/Edge.");
      return;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const text = res[0].transcript;
        if (res.isFinal) final += text + " ";
        else interim += text;
      }

      // accumulate final transcripts in a ref (so we keep history across onresult calls)
      if (final) {
        finalTranscriptRef.current = (finalTranscriptRef.current + " " + final).trim();
        interimRef.current = "";
      } else {
        interimRef.current = interim;
      }

      // update React state for UI (debounced-ish by browser events)
      const combined = (finalTranscriptRef.current + " " + interimRef.current).trim();
      setTranscript(combined);
      setDisplayTranscript(combined || "Listening...");
    };

    rec.onerror = (ev: any) => {
      console.error("Speech recognition error:", ev);
      if (ev.error === "not-allowed" || ev.error === "permission-denied") {
        setStatus("❌ Microphone access denied. Allow microphone and reload.");
      } else {
        setStatus("⚠️ Speech recognition error. Try again.");
      }
      setListening(false);
      stopTimers();
    };

    rec.onend = () => {
      // recognition ended (either by stop() or by browser)
      // we do not automatically evaluate here because main flow uses timer
      console.log("recognition ended");
    };

    recognitionRef.current = rec;

    return () => {
      // cleanup on unmount
      stopTimers();
      try {
        recognitionRef.current?.stop();
      } catch {}
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper to stop timer interval
  function stopTimers() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function startRound() {
    if (!recognitionRef.current) {
      setStatus("❌ Speech Recognition not available.");
      return;
    }

    // reset transcript refs + UI
    finalTranscriptRef.current = "";
    interimRef.current = "";
    setTranscript("");
    setDisplayTranscript("Listening...");
    setScoreText(null);
    setTimeLeft(30);
    setStatus("🎙 TALK NOW!");

    try {
      recognitionRef.current.start();
    } catch (err) {
      // sometimes calling start twice errors; ignore
      console.warn("start() error (likely already started):", err);
    }
    setListening(true);

    // start timer
    stopTimers();
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        if (next <= 10 && next > 0) {
          setStatus(`⏰ ${next}s LEFT - Keep talking!`);
        }
        if (next <= 0) {
          // time's up
          stopTimers();
          try {
            recognitionRef.current.stop();
          } catch {}
          setListening(false);
          setStatus("⏱ Time's up — evaluating...");
          // small delay to let final onresult events flush into refs
          setTimeout(() => {
            const final = (finalTranscriptRef.current || interimRef.current || "").trim();
            setTranscript(final);
            setDisplayTranscript(final || "No speech detected.");
            evaluateLocal(final);
          }, 150);
        }
        return next;
      });
    }, 1000);
  }

  function cancelOrReset() {
    stopTimers();
    try {
      recognitionRef.current?.stop();
    } catch {}
    setListening(false);
    setStatus("Click → Talk 30 seconds!");
    setTranscript("");
    finalTranscriptRef.current = "";
    interimRef.current = "";
    setDisplayTranscript("Your words will appear here...");
    setScoreText(null);
    setTimeLeft(30);
  }

  // local scoring — word-count heuristic + some encouragement
  function evaluateLocal(finalText: string) {
    const clean = (finalText || "").trim();
    if (!clean) {
      setScoreText("❌ No speech detected. Try again!");
      setStatus("❌ No speech detected. Click START to retry.");
      return;
    }

    const words = clean.split(/\s+/).filter(Boolean).length;

    let score = 0;
    let feedback = "";

    // Word-count based scoring (tuned for short speaking exercise)
    if (words >= 30) {
      score = 95;
      feedback = "🎉 Excellent — very fluent and detailed!";
    } else if (words >= 20) {
      score = 85;
      feedback = "✅ Great — clear and well-developed.";
    } else if (words >= 12) {
      score = 75;
      feedback = "👍 Good — try adding more detail and variety.";
    } else if (words >= 6) {
      score = 60;
      feedback = "🙂 Okay — speak a bit more to increase fluency.";
    } else {
      score = 45;
      feedback = "📈 Keep practicing — try to expand each sentence.";
    }

    // small bonuses heuristics (punctuation, adjectives, connectors)
    const lc = clean.toLowerCase();
    let bonus = 0;
    if (lc.includes("and") || lc.includes("but") || lc.includes("because")) bonus += 3;
    if (/[.,!?]/.test(clean)) bonus += 2;
    if (/\b(beautiful|interesting|delicious|quick|every)\b/.test(lc)) bonus += 2;

    const finalScore = Math.min(100, score + bonus);
    setScoreText(`${finalScore}% — ${feedback}`);
    setStatus(`✅ Score: ${finalScore}% — ${feedback}`);
  }

  return (
    <div className="max-w-xl mx-auto p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-xl">
      <h1 className="text-2xl font-bold mb-3">🎙 Tell Your Daily Routine</h1>

      <div className="flex items-center gap-4">
        <button
          onClick={() => (listening ? cancelOrReset() : startRound())}
          className={`w-36 h-36 rounded-full text-xl font-semibold transition-transform ${
            listening ? "bg-red-500 hover:scale-105 animate-pulse" : "bg-green-500 hover:scale-105"
          }`}
        >
          {listening ? "🗣 TALKING" : "🗣 START"}
        </button>

        <div className="flex-1">
          <div className="text-sm mb-1">Status</div>
          <div className="bg-white/10 p-3 rounded-md min-h-[64px]">
            <div className="font-medium" dangerouslySetInnerHTML={{ __html: status }} />
            <div className="mt-2 text-sm opacity-90">Timer: {timeLeft}s</div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm mb-1">Transcript</div>
        <div className="bg-white text-black p-3 rounded-md min-h-[80px] break-words">
          {displayTranscript}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm mb-1">Result</div>
        <div className="bg-white/10 p-3 rounded-md min-h-[48px]">
          {scoreText ?? "Your score will appear after the round."}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={cancelOrReset}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
        >
          Reset
        </button>
        <button
          onClick={() => {
            // small convenience: copy transcript to clipboard
            navigator.clipboard?.writeText(transcript || finalTranscriptRef.current || "");
          }}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
        >
          Copy Transcript
        </button>
      </div>
    </div>
  );
}
