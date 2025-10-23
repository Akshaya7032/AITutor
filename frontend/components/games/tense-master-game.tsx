"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useApp } from "@/components/providers/app-provider"

const TENSE_QUESTIONS = [
  {
    id: 1,
    question: "Complete: Je _____ (aller) au marché.",
    options: ["vais", "allais", "irai"],
    correct: 0,
  },
  {
    id: 2,
    question: "Complete: Elle _____ (être) très heureuse.",
    options: ["est", "était", "sera"],
    correct: 0,
  },
  {
    id: 3,
    question: "Complete: Nous _____ (avoir) un chat.",
    options: ["avons", "avions", "aurons"],
    correct: 0,
  },
]

export function TenseMasterGame() {
  const { updateGameProgress } = useApp()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)

  const current = TENSE_QUESTIONS[currentIndex]

  const handleAnswer = (selectedIdx: number) => {
    const isCorrect = selectedIdx === current.correct
    if (isCorrect) {
      setScore(score + 10)
    }
    setAnswered(true)
    setTimeout(() => {
      if (currentIndex < TENSE_QUESTIONS.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setAnswered(false)
      } else {
        updateGameProgress("tense-master", score + (isCorrect ? 10 : 0))
      }
    }, 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tense Master</CardTitle>
        <p className="text-sm text-foreground/80">Master verb conjugations and tenses</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-semibold">Score: {score}</p>
        <div className="rounded-lg border border-border/50 bg-card/50 p-4">
          <p className="text-base font-semibold">{current.question}</p>
        </div>
        <div className="space-y-2">
          {current.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={answered}
              className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary disabled:opacity-50"
              style={{
                background: answered && idx === current.correct ? "var(--brand-accent)" : undefined,
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
