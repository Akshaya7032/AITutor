"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useApp } from "@/components/providers/app-provider"

const SENTENCES = [
  {
    id: 1,
    words: ["Je", "suis", "heureux"],
    correct: "Je suis heureux",
    meaning: "I am happy",
  },
  {
    id: 2,
    words: ["Vous", "parlez", "français"],
    correct: "Vous parlez français",
    meaning: "You speak French",
  },
  {
    id: 3,
    words: ["Elle", "aime", "les", "livres"],
    correct: "Elle aime les livres",
    meaning: "She loves books",
  },
]

export function SentenceBuilderGame() {
  const { updateGameProgress } = useApp()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [arranged, setArranged] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState("")

  const current = SENTENCES[currentIndex]
  const remaining = current.words.filter((w) => !arranged.includes(w))

  const handleAddWord = (word: string) => {
    setArranged([...arranged, word])
  }

  const handleRemoveWord = (index: number) => {
    setArranged(arranged.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    const userSentence = arranged.join(" ")
    if (userSentence === current.correct) {
      setFeedback("Correct!")
      setScore(score + 10)
      setTimeout(() => {
        if (currentIndex < SENTENCES.length - 1) {
          setCurrentIndex(currentIndex + 1)
          setArranged([])
          setFeedback("")
        } else {
          updateGameProgress("sentence-builder", score + 10)
          setFeedback("Game Complete!")
        }
      }, 1500)
    } else {
      setFeedback("Try again!")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentence Builder</CardTitle>
        <p className="text-sm text-foreground/80">Arrange words to form correct sentences</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-semibold">Score: {score}</p>
        <div className="rounded-lg border border-border/50 bg-card/50 p-4">
          <p className="text-sm text-foreground/80">Meaning: {current.meaning}</p>
        </div>
        <div className="min-h-12 rounded-lg border-2 border-dashed border-border bg-background p-3">
          <div className="flex flex-wrap gap-2">
            {arranged.length === 0 ? (
              <p className="text-sm text-foreground/50">Drag words here...</p>
            ) : (
              arranged.map((word, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRemoveWord(idx)}
                  className="rounded-md px-3 py-1 text-sm font-semibold"
                  style={{ background: "var(--brand-primary)", color: "var(--primary-foreground)" }}
                >
                  {word}
                </button>
              ))
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {remaining.map((word) => (
            <button
              key={word}
              onClick={() => handleAddWord(word)}
              className="rounded-md border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-secondary"
            >
              {word}
            </button>
          ))}
        </div>
        {feedback && (
          <p
            className="text-center font-semibold"
            style={{ color: feedback === "Correct!" ? "var(--brand-accent)" : "var(--destructive)" }}
          >
            {feedback}
          </p>
        )}
        <Button
          onClick={handleSubmit}
          disabled={arranged.length === 0}
          style={{ background: "var(--brand-primary)", color: "var(--primary-foreground)" }}
        >
          Submit
        </Button>
      </CardContent>
    </Card>
  )
}
