// File: components/games/LinguaLabyrinth.tsx
"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppProvider } from "@/components/providers/app-provider"
import { AppNav } from "@/components/nav"

// Language configurations
const languages: { [key: string]: { name: string; langCode: string; grammarTypes: string[] } } = {
  en: { name: "English", langCode: "en-US", grammarTypes: ["past", "desc", "question", "present", "command"] },
  es: { name: "Spanish", langCode: "es-ES", grammarTypes: ["pasado", "descripción", "pregunta", "presente", "comando"] },
  fr: { name: "French", langCode: "fr-FR", grammarTypes: ["passé", "description", "question", "présent", "commande"] },
  de: { name: "German", langCode: "de-DE", grammarTypes: ["Vergangenheit", "Beschreibung", "Frage", "Gegenwart", "Befehl"] },
}

// Type declarations for Web Speech API
interface SpeechRecognitionResult {
  transcript: string
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: (event: SpeechRecognitionEvent) => void
  onend: () => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  start: () => void
  stop: () => void
}

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition }
    webkitSpeechRecognition: { new (): SpeechRecognition }
  }
}

interface MazePosition {
  x: number
  y: number
}

interface Challenge {
  text: string
  type: string
  correct: string
  pronunciation: string
  vocab: string
  translation: string
}

interface GameState {
  score: number
  level: number
  vocabCollected: number
  position: MazePosition
  maze: number[][]
  currentChallenge: Challenge | null
  recognition: SpeechRecognition | null
  synth: SpeechSynthesis | null
  usedChallenges: string[]
  voice: SpeechSynthesisVoice | null
}

// Utility: generate a maze
const generateMaze = (width: number, height: number): number[][] => {
  const w = Math.max(3, width)
  const h = Math.max(3, height)

  const maze = Array(h)
    .fill(undefined)
    .map(() => Array(w).fill(1))

  const carve = (x: number, y: number, depth = 0, maxDepth = 1000) => {
    if (depth > maxDepth) return
    maze[y][x] = 0
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]].sort(() => Math.random() - 0.5)
    for (const [dx, dy] of dirs) {
      const nx = x + dx * 2,
        ny = y + dy * 2
      if (nx >= 0 && nx < w && ny >= 0 && ny < h && maze[ny][nx] === 1) {
        maze[y + dy][x + dx] = 0
        carve(nx, ny, depth + 1, maxDepth)
      }
    }
  }

  const startX = Math.max(1, Math.min(w - 2, 1))
  const startY = Math.max(1, Math.min(h - 2, h - 2))
  carve(startX, startY)
  maze[0][Math.floor(w / 2)] = 0
  return maze
}

const LinguaLabyrinth: React.FC = () => {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    vocabCollected: 0,
    position: { x: 1, y: 7 },
    maze: generateMaze(5, 8),
    currentChallenge: null,
    recognition: null,
    synth,
    usedChallenges: [],
    voice: null,
  })
  const [currentLang, setCurrentLang] = useState<string>("en")
  const [status, setStatus] = useState<string>("Ready to speak")
  const [transcript, setTranscript] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const micBtnRef = useRef<HTMLButtonElement | null>(null)
  const prevStateRef = useRef<Pick<GameState, "position" | "maze" | "level" | "vocabCollected"> | null>(null)

  // Validate currentLang
  useEffect(() => {
  if (typeof window === "undefined") return;

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    setStatus("Speech recognition not supported. Please use Chrome or Edge.");
    return;
  }

  try {
    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = languages[currentLang]?.langCode || languages.en.langCode;

    // Stop any previous recognition
    if (gameState.recognition && typeof gameState.recognition.stop === "function") {
      gameState.recognition.stop();
    }

    // Add event listeners here to catch initialization issues
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setStatus(`Initialization error: ${event.error || "unknown"}`);
    };

    setGameState((prev) => ({ ...prev, recognition }));
  } catch (err) {
    console.warn("Could not initialize SpeechRecognition:", err);
    setStatus("Speech recognition initialization failed");
  }
}, [currentLang]);
  // Select voice
  const selectVoice = useCallback(() => {
    if (!gameState.synth) {
      setStatus("Speech synthesis not available")
      return
    }

    const voices = gameState.synth.getVoices()
    if (!voices || voices.length === 0) {
      gameState.synth.onvoiceschanged = selectVoice
      return
    }

    const voiceMap: { [key: string]: string[] } = {
      en: ["en-US", "en-GB"],
      es: ["es-ES", "es-MX"],
      fr: ["fr-FR", "fr-CA"],
      de: ["de-DE", "de-AT"],
    }

    const preferredLangs = voiceMap[currentLang] || [languages.en.langCode]
    const voice = voices.find((v) => preferredLangs.includes(v.lang)) || voices.find((v) => v.lang === languages.en.langCode)

    if (!voice) {
      setStatus("No suitable voice found. Using default.")
      setGameState((prev) => ({ ...prev, voice: voices[0] || null }))
      return
    }

    setGameState((prev) => ({ ...prev, voice }))
  }, [currentLang, gameState.synth])

  useEffect(() => {
    selectVoice()
  }, [selectVoice])

  // Helper: difficulty
  const getDifficulty = () => {
    if (gameState.level < 4) return "easy"
    if (gameState.level < 7) return "medium"
    return "hard"
  }

  // String similarity helpers
  const levenshteinDistance = (a: string, b: string): number => {
    const aLen = a.length
    const bLen = b.length
    if (aLen === 0) return bLen
    if (bLen === 0) return aLen

    const matrix = Array.from({ length: bLen + 1 }, (_, i) => Array(aLen + 1).fill(0))
    for (let i = 0; i <= bLen; i++) matrix[i][0] = i
    for (let j = 0; j <= aLen; j++) matrix[0][j] = j

    for (let i = 1; i <= bLen; i++) {
      for (let j = 1; j <= aLen; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1]
        else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
      }
    }
    return matrix[bLen][aLen]
  }

  const levenshteinSimilarity = (a: string, b: string): number => {
    const distance = levenshteinDistance(a, b)
    const maxLength = Math.max(a.length, b.length)
    return maxLength === 0 ? 1 : 1 - distance / maxLength
  }

  const stringSimilarity = (s1: string, s2: string): number => {
    if (s1 === s2) return 1.0
    if (!s1.length || !s2.length) return 0
    const dist = levenshteinDistance(s1, s2)
    const maxLen = Math.max(s1.length, s2.length)
    return 1 - dist / maxLen
  }

  const checkPronunciation = (userTranscript: string, correctText: string) => {
    const cleanUser = userTranscript.toLowerCase().replace(/[^\w\sÀ-ÿßœ'-]/g, "").trim()
    const cleanCorrect = correctText.toLowerCase().replace(/[^\w\sÀ-ÿßœ'-]/g, "").trim()

    const diff = getDifficulty()
    const thresholds = {
      easy: { wordMatch: 0.6, charMatch: 0.55 },
      medium: { wordMatch: 0.75, charMatch: 0.7 },
      hard: { wordMatch: 0.85, charMatch: 0.8 },
    }
    const threshold = thresholds[diff as keyof typeof thresholds]

    const userWords = cleanUser.split(/\s+/).filter((w) => w.length > 0)
    const correctWords = cleanCorrect.split(/\s+/).filter((w) => w.length > 0)

    let wordMatches = 0
    for (let i = 0; i < correctWords.length; i++) {
      if (i < userWords.length) {
        const similarity = stringSimilarity(userWords[i], correctWords[i])
        if (similarity > 0.7) wordMatches++
      }
    }
    const wordAccuracy = correctWords.length === 0 ? 0 : wordMatches / correctWords.length
    const charSimilarity = levenshteinSimilarity(cleanUser, cleanCorrect)

    const isCorrect = wordAccuracy >= threshold.wordMatch && charSimilarity >= threshold.charMatch

    return { isCorrect, wordAccuracy, charSimilarity, details: { userWords, correctWords, wordMatches } }
  }

  // Fetch a new challenge
  const nextChallenge = useCallback(async () => {
    const diff = getDifficulty()
    const grammarType = languages[currentLang]?.grammarTypes[Math.floor(Math.random() * languages[currentLang].grammarTypes.length)] || languages.en.grammarTypes[0]
    setStatus("Loading challenge...")
    setTranscript("")

    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
    if (!apiKey) {
      setStatus("Warning: API key missing — using fallback challenge")
    }

    try {
      if (apiKey) {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content: `Generate a ${grammarType} sentence in ${currentLang} with ${diff} difficulty. Return ONLY valid JSON: {\"sentence\": \"the sentence\", \"translation\": \"english translation\", \"pronunciation\": \"phonetic guide\"}`,
              },
            ],
            max_tokens: 60,
          }),
        })

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        if (data?.choices?.[0]?.message?.content) {
          try {
            const result = JSON.parse(data.choices[0].message.content)
            setGameState((prev) => ({
              ...prev,
              currentChallenge: {
                text: `Say: "${result.sentence || ""}"`,
                type: grammarType,
                correct: (result.sentence || "").toLowerCase(),
                pronunciation: result.pronunciation || result.sentence || "",
                vocab: (result.sentence || "").split(" ")[0] || "",
                translation: result.translation || "",
              },
            }))
            setStatus("Ready to speak")
            return
          } catch (err) {
            console.warn("Could not parse model JSON, using fallback:", err)
          }
        }
      }

      // Fallbacks
      const fallbacks: { [key: string]: { sentence: string; translation: string; pronunciation: string } } = {
        en: { sentence: "I walked to the treasure", translation: "I moved to the treasure", pronunciation: "I wawkt too thuh treh-zhur" },
        es: { sentence: "Caminé al tesoro", translation: "I walked to the treasure", pronunciation: "Kah-mee-NAY ahl teh-SOH-roh" },
        fr: { sentence: "Je suis allé au trésor", translation: "I went to the treasure", pronunciation: "Zhuh swee zah-lay oh tray-ZOR" },
        de: { sentence: "Ich ging zum Schatz", translation: "I went to the treasure", pronunciation: "Ish ging tsoom shats" },
      }
      const fb = fallbacks[currentLang] || fallbacks.en
      setGameState((prev) => ({
        ...prev,
        currentChallenge: {
          text: `Say: "${fb.sentence}"`,
          type: "past",
          correct: fb.sentence.toLowerCase(),
          pronunciation: fb.pronunciation,
          vocab: fb.sentence.split(" ")[0],
          translation: fb.translation,
        },
      }))
      setStatus("Ready to speak")
    } catch (error) {
      console.error("API Error:", error)
      setStatus("Error loading challenge — using fallback")
    }
  }, [currentLang, gameState.level])

  // Start listening & handle results
  const startListening = () => {
  const recognition = gameState.recognition;
  const challenge = gameState.currentChallenge;
  if (!recognition || !challenge) {
    setStatus("Error: Speech recognition or challenge not available");
    return;
  }

  micBtnRef.current?.classList.add("mic-listening");
  setStatus("Listening... 🗣");
  setTranscript("");

  // Request microphone permission if not granted
  if (typeof recognition.start === "function") {
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      try {
        const resultList = event.results[0];
        if (resultList && resultList.length > 0) {
          const userTranscript = resultList[0].transcript || "";
          console.log("Transcript:", userTranscript); // Debug log
          setTranscript(userTranscript);
          const result = checkPronunciation(userTranscript, challenge.correct);

          if (result.isCorrect) {
            setStatus(`✅ Perfect! (${Math.round(result.wordAccuracy * 100)}% match)`);
            successMove();
            setGameState((prev) => ({ ...prev, score: prev.score + 10 * prev.level }));
            setTimeout(() => nextChallenge().catch(() => {}), 1000);
          } else {
            setStatus(`❌ Not quite! (${Math.round(result.wordAccuracy * 100)}% match)`);
            speakAICorrection();
          }
        }
      } catch (err) {
        console.error("onresult error:", err);
        setStatus("Error processing speech input");
      }
    };

    recognition.onend = () => {
      micBtnRef.current?.classList.remove("mic-listening");
      setStatus((s) => (s.includes("Click") ? s : "Click to speak again"));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setStatus(`Error: ${event.error || "unknown"}`);
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        setStatus("Please allow microphone access in your browser settings.");
      }
      micBtnRef.current?.classList.remove("mic-listening");
    };

    try {
      recognition.start();
      console.log("Speech recognition started"); // Debug log
    } catch (err) {
      console.warn("Recognition start error:", err);
      setStatus("Error starting speech recognition");
    }
  } else {
    setStatus("Speech recognition not available");
  }
};

  const speakAICorrection = (text?: string) => {
    if (!gameState.currentChallenge || !gameState.synth) {
      setStatus("Speech synthesis not available")
      return
    }

    const correctionText = text || `${languages[currentLang].name} pronunciation: ${gameState.currentChallenge.pronunciation}`
    if (!gameState.voice) {
      setStatus("No voice available. Try again.")
      return
    }

    const utterance = new SpeechSynthesisUtterance(correctionText)
    utterance.voice = gameState.voice
    utterance.lang = gameState.voice.lang || languages[currentLang].langCode
    utterance.volume = 1
    utterance.rate = 0.85
    utterance.pitch = 1.05

    gameState.synth.speak(utterance)

    utterance.onend = () => {
      setTimeout(() => {
        setStatus("Listen & Try again! 🔊")
      }, 500)
    }
  }

  const successMove = () => {
    setGameState((prev) => {
      const newPosition = { ...prev.position }
      if (newPosition.y > 0) newPosition.y--
      const newVocabCollected = prev.vocabCollected + 1
      return { ...prev, position: newPosition, vocabCollected: newVocabCollected }
    })
  }

  const showHint = () => {
    const hints: { [key: string]: string } = {
      past: "Past tense: walked, went, ate",
      desc: "Adjectives: big, red, beautiful",
      question: "Questions: Where? What? How?",
      present: "Present: walk, go, eat",
      command: "Commands: Open! Run! Stop!",
      pasado: "Pasado: caminé, fui, comí",
      descripción: "Adjetivos: grande, rojo, hermoso",
      pregunta: "¿Dónde? ¿Qué? ¿Cómo?",
      presente: "Presente: camino, voy, como",
      comando: "¡Abre! ¡Corre! ¡Para!",
      passé: "Passé: allé, vins, mangeai",
      description: "Adjectifs: grand, rouge, beau",
      présent: "Présent: marche, vais, mange",
      commande: "Ouvre! Cours! Arrête!",
      Vergangenheit: "Vergangenheit: ging, kam, aß",
      Beschreibung: "Adjektive: groß, rot, schön",
      Frage: "Wo? Was? Wie?",
      Gegenwart: "Gegenwart: gehe, esse, sehe",
      Befehl: "Öffne! Lauf! Halt!",
    }
    const hintText = hints[gameState.currentChallenge?.type || ""] || "Think about grammar!"
    alert(`💡 ${hintText}`)
  }

  // Canvas drawing loop & resize handling
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.floor(width)
      canvas.height = Math.floor(height)
    }

    resize()

    let animationFrameId: number
    const drawMaze = () => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      const cellW = ctx.canvas.width / 5
      const cellH = ctx.canvas.height / 8

      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 5; x++) {
          if (gameState.maze[y]?.[x] === 1) {
            ctx.fillStyle = "#34495e"
            ctx.fillRect(x * cellW, y * cellH, cellW, cellH)
          }
        }
      }

      ctx.fillStyle = "#e74c3c"
      ctx.beginPath()
      ctx.arc(gameState.position.x * cellW + cellW / 2, gameState.position.y * cellH + cellH / 2, Math.min(cellW, cellH) / 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "#f1c40f"
      ctx.fillRect(3 * cellW, 0, cellW, cellH)
    }

    const loop = () => {
      const prev = prevStateRef.current
      const levelUpThreshold = Math.floor(gameState.vocabCollected / 3) + 1
      if (gameState.level < levelUpThreshold) {
        setGameState((prev) => ({ ...prev, level: levelUpThreshold }))
        speakAICorrection(`🎉 Level ${levelUpThreshold} unlocked!`)
      }

      if (
        !prev ||
        prev.position.x !== gameState.position.x ||
        prev.position.y !== gameState.position.y ||
        prev.maze !== gameState.maze ||
        prev.level !== gameState.level
      ) {
        drawMaze()
        prevStateRef.current = {
          position: { ...gameState.position },
          maze: gameState.maze,
          level: gameState.level,
          vocabCollected: gameState.vocabCollected,
        }
      }

      animationFrameId = requestAnimationFrame(loop)
    }

    animationFrameId = requestAnimationFrame(loop)
    window.addEventListener("resize", resize)
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", resize)
    }
  }, [gameState.position, gameState.maze, gameState.level, gameState.vocabCollected])

  // Initial challenge load
  useEffect(() => {
    nextChallenge().catch(() => {})
  }, [nextChallenge])

  if (gameState.position.y === 0) {
    return (
      <AppProvider>
        <AppNav />
        <main className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] flex justify-center items-center p-4">
          <Card className="bg-white/95 rounded-xl shadow-2xl p-4">
            <CardHeader>
              <CardTitle>Lingua Labyrinth - Game Over!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-2xl font-bold" style={{ color: "var(--brand-accent, #e74c3c)" }}>
                Final Score: {gameState.score}
              </p>
              <Button
                onClick={() =>
                  setGameState((prev) => ({
                    ...prev,
                    score: 0,
                    level: 1,
                    vocabCollected: 0,
                    position: { x: 1, y: 7 },
                    maze: generateMaze(5, 8),
                    usedChallenges: [],
                    currentChallenge: null,
                  }))
                }
                style={{ background: "var(--brand-primary, #3498db)", color: "var(--primary-foreground, #ffffff)" }}
              >
                Play Again
              </Button>
            </CardContent>
          </Card>
        </main>
      </AppProvider>
    )
  }

  return (
    <AppProvider>
      <AppNav />
      <main className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] flex justify-center items-center p-4">
        <div className="relative w-full max-w-4xl">
          <div className="absolute top-4 right-4 bg-white/90 rounded-lg p-2">
            <select
              value={currentLang}
              onChange={(e) => {
                const newLang = e.target.value
                if (languages[newLang]) {
                  setCurrentLang(newLang)
                  setGameState((prev) => ({ ...prev, usedChallenges: [] }))
                  nextChallenge().catch(() => {})
                }
              }}
              className="p-2 rounded-md bg-transparent"
              aria-label="Select language"
            >
              {Object.keys(languages).map((lang) => (
                <option key={lang} value={lang}>
                  {languages[lang].name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 bg-white/95 rounded-xl shadow-2xl p-4">
            <Card className="bg-[#2c3e50] border-none">
              <CardHeader>
                <CardTitle className="text-white text-center">🗺 Maze</CardTitle>
              </CardHeader>
              <CardContent>
                <canvas
                  ref={canvasRef}
                  className="border-4 border-[#34495e] rounded-lg bg-[#ecf0f1] w-full h-[300px]"
                  aria-label="Maze game board"
                />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Card className="bg-gradient-to-r from-[#3498db] to-[#2980b9] border-none">
                <CardContent className="p-6 text-center text-white min-h-[180px] flex flex-col justify-center">
                  <p className="text-lg font-semibold">{gameState.currentChallenge?.text || "Click microphone to start your adventure! 🗣"}</p>
                  <p className="text-sm italic text-[#f0f0f0] mt-2">Translation: {gameState.currentChallenge?.translation || "N/A"}</p>
                  <Button
                    onClick={showHint}
                    className="mt-4 bg-white/20 hover:bg-white/30 text-white border-none rounded-full"
                    aria-label="Show hint"
                  >
                    💡 Hint
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-[#f8f9fa] border-[#ddd]">
                <CardContent className="p-4 text-center space-y-4">
                  <div
                    className={`p-2 rounded-lg font-bold ${
                      status.includes("✅")
                        ? "bg-[#d4edda] text-[#155724]"
                        : status.includes("❌")
                        ? "bg-[#f8d7da] text-[#721c24]"
                        : "bg-[#d1ecf1] text-[#0c5460]"
                    }`}
                  >
                    {status}
                  </div>
                  <Button
                    ref={micBtnRef}
                    onClick={startListening}
                    className={`w-16 h-16 rounded-full text-2xl transition-transform ${
                      status.includes("Listening") ? "bg-[#e74c3c] text-white animate-pulse" : "bg-[#eeefee] text-black"
                    }`}
                    disabled={!gameState.recognition || !gameState.currentChallenge || status.includes("Loading")}
                    aria-label="Start speech recognition"
                  >
                    🎤
                  </Button>
                  <div className="bg-white rounded-md p-2 font-mono min-h-[20px]">{transcript}</div>
                </CardContent>
              </Card>

              <Card className="bg-[#f1f2f6] border-none">
                <CardContent className="p-4 grid grid-cols-3 gap-2">
                  <div className="bg-white p-2 rounded-lg text-center">⭐ <span>{gameState.score}</span></div>
                  <div className="bg-white p-2 rounded-lg text-center">🏆 <span>{gameState.level}</span></div>
                  <div className="bg-white p-2 rounded-lg text-center">📚 <span>{gameState.vocabCollected}</span></div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </AppProvider>
  )
}

export default LinguaLabyrinth