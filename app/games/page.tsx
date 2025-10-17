"use client"

import { useState } from "react"
import { AppNav } from "@/components/nav"
import { AppProvider } from "@/components/providers/app-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LinguaLabyrinth } from "@/components/games/Lingua-Labyrinth"
import { SentenceBuilderGame } from "@/components/games/sentence-builder-game"
import { ListeningChallengeGame } from "@/components/games/listening-challenge-game"
import { TenseMasterGame } from "@/components/games/tense-master-game"

function GamesInner() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)

  const games = [
    { id: "LinguaLabyrinth", name: "LinguaLabyrinth", description: "Pronounce the sentence perfectly to move on" },
    { id: "sentence-builder", name: "Sentence Builder", description: "Arrange words to form sentences" },
    { id: "listening-challenge", name: "Listening Challenge", description: "Listen and repeat the same" },
    { id: "tense-master", name: "Tense Master", description: "Master verb conjugations" },
  ]

  if (selectedGame) {
    return (
      <main className="mx-auto grid max-w-4xl gap-6 px-4 py-8">
        <Button variant="outline" onClick={() => setSelectedGame(null)}>
          Back to Games
        </Button>
        {selectedGame === "maze" && <LinguaLabyrinth />}
        {selectedGame === "sentence-builder" && <SentenceBuilderGame />}
        {selectedGame === "listening-challenge" && <ListeningChallengeGame />}
        {selectedGame === "tense-master" && <TenseMasterGame />}
      </main>
    )
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8">
      <section>
        <h1 className="text-3xl font-bold">Language Games</h1>
        <p className="mt-2 text-foreground/80">Learn through interactive games and challenges</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {games.map((game) => (
          <Card key={game.id} className="cursor-pointer transition-all hover:border-primary">
            <CardHeader>
              <CardTitle>{game.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground/80">{game.description}</p>
              <Button
                onClick={() => setSelectedGame(game.id)}
                style={{ background: "var(--brand-primary)", color: "var(--primary-foreground)" }}
              >
                Play Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  )
}

export default function GamesPage() {
  return (
    <AppProvider>
      <AppNav />
      <GamesInner />
    </AppProvider>
  )
}
