"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTTS } from "@/hooks/use-tts"
import { useApp } from "@/components/providers/app-provider"

const LISTENING_ITEMS = [
  {
    id: 1,
    phrase: "Bonjour, comment allez-vous?",
    options: ["Hello, how are you?", "Goodbye, see you later", "Thank you very much"],
  },
  { id: 2, phrase: "Je m'appelle Marie", options: ["My name is Marie", "I like Marie", "Marie is here"] },
  {
    id: 3,
    phrase: "Où est la gare?",
    options: ["Where is the station?", "What is the station?", "When is the station?"],
  },
]

export function ListeningChallengeGame() {
  const { speak } = useTTS()
  const { updateGameProgress } = useApp()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)

  const current = LISTENING_ITEMS[currentIndex]

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(score + 10)
    }
    setAnswered(true)
    setTimeout(() => {
      if (currentIndex < LISTENING_ITEMS.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setAnswered(false)
      } else {
        updateGameProgress("listening-challenge", score + (isCorrect ? 10 : 0))
      }
    }, 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Listening Challenge</CardTitle>
        <p className="text-sm text-foreground/80">Listen and select the correct translation</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-semibold">Score: {score}</p>
        <Button
          onClick={() => speak(current.phrase, "fr-FR")}
          style={{ background: "var(--brand-accent)", color: "var(--accent-foreground)" }}
          className="w-full"
        >
          Play Audio
        </Button>
        <div className="space-y-2">
          {current.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx === 0)}
              disabled={answered}
              className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary disabled:opacity-50"
            >
              {option}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
