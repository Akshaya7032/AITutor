"use client"

import type React from "react"
import { createContext, useContext, useMemo, useState } from "react"

type GameProgress = {
  gameId: string
  gameName: string
  score: number
  attempts: number
  bestScore: number
  lastPlayed: string
}

type Profile = {
  name: string
  language: string
  proficiency: "Beginner" | "Intermediate" | "Advanced"
  dailyGoal: number
  badges: Array<{ id: string; label: string; earned: boolean }>
  progress: Array<{ day: string; score: number }>
  gameProgress: GameProgress[]
}

type AppContextType = {
  profile: Profile
  setLanguage: (lang: string) => void
  setProficiency: (p: Profile["proficiency"]) => void
  updateGameProgress: (gameId: string, score: number) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>({
    name: "Learner",
    language: "French",
    proficiency: "Beginner",
    dailyGoal: 20,
    badges: [
      { id: "streak", label: "7-Day Streak", earned: true },
      { id: "pronunciation", label: "Pronunciation Pro", earned: false },
      { id: "grammar", label: "Grammar Guru", earned: false },
    ],
    progress: [
      { day: "Mon", score: 40 },
      { day: "Tue", score: 55 },
      { day: "Wed", score: 65 },
      { day: "Thu", score: 70 },
      { day: "Fri", score: 72 },
      { day: "Sat", score: 80 },
      { day: "Sun", score: 90 },
    ],
    gameProgress: [
      { gameId: "word-match", gameName: "Word Match", score: 0, attempts: 0, bestScore: 0, lastPlayed: "" },
      { gameId: "sentence-builder", gameName: "Sentence Builder", score: 0, attempts: 0, bestScore: 0, lastPlayed: "" },
      {
        gameId: "listening-challenge",
        gameName: "Listening Challenge",
        score: 0,
        attempts: 0,
        bestScore: 0,
        lastPlayed: "",
      },
      { gameId: "tense-master", gameName: "Tense Master", score: 0, attempts: 0, bestScore: 0, lastPlayed: "" },
    ],
  })

  const setLanguage = (language: string) => setProfile((p) => ({ ...p, language }))
  const setProficiency = (proficiency: Profile["proficiency"]) => setProfile((p) => ({ ...p, proficiency }))

  const updateGameProgress = (gameId: string, score: number) => {
    setProfile((p) => ({
      ...p,
      gameProgress: p.gameProgress.map((gp) =>
        gp.gameId === gameId
          ? {
              ...gp,
              score,
              attempts: gp.attempts + 1,
              bestScore: Math.max(gp.bestScore, score),
              lastPlayed: new Date().toLocaleDateString(),
            }
          : gp,
      ),
    }))
  }

  const value = useMemo(() => ({ profile, setLanguage, setProficiency, updateGameProgress }), [profile])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
