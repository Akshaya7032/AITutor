"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * SentenceBuilderGame
 * - Language support: en-US, es-ES, fr-FR, de-DE, hi-IN (Hindi)
 * - Uses browser TTS and SpeechRecognition
 * - Scoring uses Unicode-aware Levenshtein similarity (0-100)
 * - Keeps UI + behavior matching your HTML page
 */

export default function SentenceBuilderGame() {
  const router = useRouter();
  const [language, setLanguage] = useState("en-US");
  const [category, setCategory] = useState("daily");
  const [currentPhrase, setCurrentPhrase] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [progressText, setProgressText] = useState("Sentence 0/3");
  const [countdown, setCountdown] = useState("");
  const [feedback, setFeedback] = useState('Press "AI Pronounce" to start!');
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    createFloatingCircles();
    return () => {
      // cleanup any floating nodes if desired (not strictly necessary)
      try {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        recognitionRef.current?.abort?.();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // phrases including English, Spanish, French, German, Hindi
  const samplePhrases: Record<string, Record<string, string[]>> = {
    "en-US": {
      daily: [
        "I wake up early and drink coffee.",
        "I like to read books before bed.",
        "I take a walk every morning.",
      ],
      travel: [
        "I love exploring new cities.",
        "The flight was very comfortable.",
        "We stayed at a beautiful hotel.",
      ],
      work: [
        "I attend meetings every Monday.",
        "My boss gave me a new project.",
        "I enjoy collaborating with my team.",
      ],
      idioms: ["Break a leg before your performance!", "It's raining cats and dogs today.", "Better late than never."],
    },
    "es-ES": {
      daily: [
        "Me gusta leer por la tarde.",
        "Despierto temprano y tomo café.",
        "Salgo a caminar todas las mañanas.",
      ],
      travel: [
        "Me encanta explorar nuevas ciudades.",
        "El vuelo fue muy cómodo.",
        "Nos alojamos en un hotel precioso.",
      ],
      work: [
        "Tengo una reunión a las 10.",
        "Él trabaja en un nuevo proyecto.",
        "La presentación salió muy bien.",
      ],
      idioms: ["¡Buena suerte!", "Está chupado (pan comido).", "Más vale tarde que nunca."],
    },
    "fr-FR": {
      daily: [
        "Je me réveille tôt et je bois du café.",
        "J'aime lire des livres avant de dormir.",
        "Je fais une promenade chaque matin.",
      ],
      travel: [
        "J'adore découvrir de nouvelles villes.",
        "Le vol était très confortable.",
        "Nous avons séjourné dans un bel hôtel.",
      ],
      work: [
        "J'ai une réunion à dix heures.",
        "Il travaille sur un nouveau projet.",
        "La présentation s'est très bien passée.",
      ],
      idioms: ["Bonne chance !", "C'est du gâteau !", "Mieux vaut tard que jamais."],
    },
    "de-DE": {
      daily: [
        "Ich stehe früh auf und trinke Kaffee.",
        "Ich lese gern Bücher vor dem Schlafen.",
        "Ich mache jeden Morgen einen Spaziergang.",
      ],
      travel: [
        "Ich liebe es, neue Städte zu entdecken.",
        "Der Flug war sehr bequem.",
        "Wir haben in einem schönen Hotel übernachtet.",
      ],
      work: [
        "Ich habe um 10 Uhr ein Meeting.",
        "Er arbeitet an einem neuen Projekt.",
        "Die Präsentation lief sehr gut.",
      ],
      idioms: ["Viel Glück!", "Das ist ein Kinderspiel!", "Besser spät als nie."],
    },
    "hi-IN": {
      daily: [
        "मैं सुबह जल्दी उठता हूँ और चाय पीता हूँ।",
        "मुझे सोने से पहले किताबें पढ़ना पसंद है।",
        "मैं हर सुबह टहलने जाता हूँ।",
      ],
      travel: [
        "मुझे नई जगहें घूमना पसंद है।",
        "उड़ान बहुत आरामदायक थी।",
        "हम एक सुंदर होटल में रुके थे।",
      ],
      work: [
        "मेरी मीटिंग सुबह दस बजे है।",
        "वह एक नए प्रोजेक्ट पर काम कर रहा है।",
        "प्रेजेंटेशन बहुत अच्छा गया।",
      ],
      idioms: ["शुभकामनाएँ!", "यह बहुत आसान है!", "देर आए दुरुस्त आए।"],
    },
  };

  // ---------- Utility: Unicode-aware normalization ----------
  // Keep letters from any language (using \p{L}), numbers, and spaces.
  function normalizeUnicodeText(s: string) {
    if (!s) return "";
    // remove punctuation but keep letters (including accented & non-latin) and numbers and spaces
    return s
      .normalize("NFC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]+/gu, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // ---------- Levenshtein distance (unicode-safe) ----------
  function levenshtein(a: string, b: string) {
    // simple DP implementation; uses code points to be unicode-aware
    const A = Array.from(a);
    const B = Array.from(b);
    const n = A.length;
    const m = B.length;
    if (n === 0) return m;
    if (m === 0) return n;
    const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 0; i <= n; i++) dp[i][0] = i;
    for (let j = 0; j <= m; j++) dp[0][j] = j;
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const cost = A[i - 1] === B[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[n][m];
  }

  // similarity 0..100
  function similarityScore(a: string, b: string) {
    const na = normalizeUnicodeText(a);
    const nb = normalizeUnicodeText(b);
    if (!na && !nb) return 0;
    if (!na || !nb) return 0;
    const dist = levenshtein(na, nb);
    const maxLen = Math.max(Array.from(na).length, Array.from(nb).length);
    const sim = Math.max(0, 1 - dist / maxLen);
    return Math.round(sim * 100);
  }

  // ---------- Game functions ----------
  const playAndRecord = async () => {
    if (attemptCount >= 3) {
      const avgScore = Math.round(totalScore / 3);
      setFeedback(`🎯 Average Score: ${avgScore}%\nRestarting game...`);
      setAttemptCount(0);
      setTotalScore(0);
      setCurrentPhrase("");
      setProgressText("Sentence 0/3");
      setCountdown("");
      timeoutRef.current = setTimeout(() => {
        setFeedback('Press "AI Pronounce" to start!');
        setProgressText("Sentence 0/3");
      }, 3500);
      return;
    }

    const phrasesForLang = samplePhrases[language];
    const list = phrasesForLang?.[category] ?? ["Try again later."];
    const phrase = list[Math.floor(Math.random() * list.length)];
    setCurrentPhrase(phrase);
    setProgressText(`Sentence ${attemptCount + 1}/3`);

    // TTS
    if ("speechSynthesis" in window) {
      const utt = new SpeechSynthesisUtterance(phrase);
      utt.lang = language;
      const speak = () => {
        const voices = speechSynthesis.getVoices();
        const v = voices.find((x) => x.lang === utt.lang);
        if (v) utt.voice = v;
        speechSynthesis.cancel();
        speechSynthesis.speak(utt);
        utt.onend = () => startCountdown(3);
      };
      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.onvoiceschanged = speak;
      } else speak();
    } else {
      startCountdown(3);
    }
  };

  const startCountdown = (seconds: number) => {
    let count = seconds;
    setCountdown(String(count));
    const iv = setInterval(() => {
      count--;
      if (count > 0) setCountdown(String(count));
      else {
        clearInterval(iv);
        setCountdown("Speak! 🎙");
        setTimeout(() => {
          setCountdown("");
          startRecording();
        }, 500);
      }
    }, 1000);
  };

  const startRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SR();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setFeedback("Recording... Speak now.");
    };

    recognition.onresult = (event: any) => {
      // get the full transcript from result
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      handleResult(transcript);
    };

    recognition.onerror = (ev: any) => {
      setFeedback(`Error: ${ev.error}`);
    };

    recognition.onend = () => {
      // nothing special here
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleResult = (userSpeech: string) => {
    // compute similarity against currentPhrase
    const score = similarityScore(currentPhrase, userSpeech);

    // small heuristic: boost for longer responses if they match partially
    const len = normalizeUnicodeText(userSpeech).split(/\s+/).filter(Boolean).length;
    const bonus = Math.min(5, Math.floor(len / 8) * 1); // tiny bonus per ~8 words
    const finalScore = Math.min(100, score + bonus);

    setTotalScore((s) => s + finalScore);
    setAttemptCount((c) => c + 1);

    let fb = `You said: "${userSpeech}"\nScore: ${finalScore}%\n`;
    if (finalScore > 90) fb += "Excellent! 🎉";
    else if (finalScore > 70) fb += "Good! 👍 Keep practicing.";
    else fb += "Keep practicing! 💪 Focus on pronunciation.";

    setFeedback(fb);

    // automatically continue after short delay
    setTimeout(() => {
      playAndRecord();
    }, 1300);
  };

  // ---------- UI ----------
  return (
    <div
      style={{
        fontFamily: "'Roboto', sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background:
          "url('https://images.unsplash.com/photo-1503323391168-75b6f829cea9?auto=format&fit=crop&w=1950&q=80') center/cover no-repeat",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(-45deg, rgba(0,0,0,0.3), rgba(0,0,0,0.3))",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          background: "rgba(255,255,255,0.08)",
          padding: "36px 28px",
          borderRadius: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          width: "92%",
          maxWidth: 640,
          textAlign: "center",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#f0f8ff",
        }}
      >
        <h1 style={{ color: "#ffd700", marginBottom: 14, fontSize: 26 }}>
          🎧 Shadow Talk – Listen & Repeat
        </h1>

        <div style={{ marginBottom: 10 }}>
          <label style={{ marginRight: 8 }}>Choose Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ padding: 8, borderRadius: 8, marginRight: 12 }}
          >
            <option value="en-US">English</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
            <option value="hi-IN">Hindi</option>
          </select>

          <label style={{ marginLeft: 6, marginRight: 8 }}>Choose Category:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ padding: 8, borderRadius: 8 }}
          >
            <option value="daily">Daily Life</option>
            <option value="travel">Travel</option>
            <option value="work">Work/Business</option>
            <option value="idioms">Idioms & Expressions</option>
          </select>
        </div>

        <div style={{ fontSize: 22, margin: "18px 0", minHeight: 48, color: "#fff" }}>
          {currentPhrase || 'Press "AI Pronounce" to start!'}
        </div>

        <div style={{ color: "#ffd700", marginBottom: 8 }}>{progressText}</div>
        <div style={{ color: "#00ffff", marginBottom: 8, fontSize: 20 }}>{countdown}</div>

        <div style={{ color: "#ff69b4", marginTop: 10, whiteSpace: "pre-line", minHeight: 84 }}>
          {feedback}
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            onClick={playAndRecord}
            style={{
              margin: 8,
              padding: "12px 22px",
              borderRadius: 50,
              background: "linear-gradient(45deg,#00c6ff,#0072ff)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            🎤 AI Pronounce
          </button>

          <button
            onClick={() => router.push("/games")}
            style={{
              margin: 8,
              padding: "12px 22px",
              borderRadius: 50,
              background: "linear-gradient(45deg,#ff7eb3,#ff758c)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            ⬅ Back
          </button>
        </div>
      </div>

      <style jsx global>{`
        .circle {
          position: absolute;
          border-radius: 50%;
          opacity: 0.28;
          animation: float 20s linear infinite;
          pointer-events: none;
        }
        @keyframes float {
          0% { transform: translateY(100vh) scale(0.6); }
          100% { transform: translateY(-200px) scale(1.2); }
        }
      `}</style>
    </div>
  );

  // ---------- helper to create floating circles (keeps original vibe) ----------
  function createFloatingCircles() {
    for (let i = 0; i < 12; i++) {
      const el = document.createElement("div");
      el.className = "circle";
      const size = Math.round(Math.random() * 100 + 40);
      el.style.width = el.style.height = `${size}px`;
      el.style.left = `${Math.random() * window.innerWidth}px`;
      el.style.top = `${Math.random() * (window.innerHeight + 200)}px`;
      el.style.background = "radial-gradient(circle, rgba(255,255,255,0.35), rgba(255,255,255,0))";
      el.style.animationDuration = `${10 + Math.random() * 20}s`;
      document.body.appendChild(el);
      // remove after some time to keep DOM clean
      setTimeout(() => el.remove(), 60000);
    }
  }
}
