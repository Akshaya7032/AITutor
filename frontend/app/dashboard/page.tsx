"use client"

import Image from "next/image"
import Link from "next/link"
import { AppNav } from "@/components/nav"
import { AppProvider, useApp } from "@/components/providers/app-provider"
import { ProgressChart } from "@/components/dashboard/progress-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function DashboardInner() {
  const { profile } = useApp()
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Welcome back, {profile.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-foreground/80">Today's goal: {profile.dailyGoal} minutes</p>
              <div className="mt-4">
                <ProgressChart />
              </div>
            </div>
            <div className="rounded-lg border border-border/50 p-4">
              <p className="mb-3 text-sm text-foreground/80">Badges</p>
              <ul className="grid grid-cols-2 gap-3">
                {profile.badges.map((b) => (
                  <li key={b.id} className="flex items-center gap-2 rounded-md border border-border/50 bg-card p-3">
                    <Image src="/images/badge-generic.jpg" width={28} height={28} alt="Fluency badge" />
                    <span className="text-sm" style={{ color: b.earned ? "var(--brand-accent)" : undefined }}>
                      {b.label}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <Button size="sm" style={{ background: "var(--brand-primary)", color: "var(--primary-foreground)" }}>
                  View All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Daily Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border/50 p-4 text-center">
              <p className="text-4xl font-semibold" style={{ color: "var(--brand-warn)" }}>
                7
              </p>
              <p className="mt-2 text-sm text-foreground/80">Keep it going!</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Game Progress</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {profile.gameProgress.map((game) => (
            <Card key={game.gameId}>
              <CardHeader>
                <CardTitle className="text-base">{game.gameName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/80">Best Score:</span>
                  <span className="font-semibold" style={{ color: "var(--brand-accent)" }}>
                    {game.bestScore}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/80">Attempts:</span>
                  <span className="font-semibold">{game.attempts}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/80">Last Played:</span>
                  <span className="font-semibold">{game.lastPlayed || "Never"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Link href="/games" className="mt-4 inline-block">
          <Button style={{ background: "var(--brand-primary)", color: "var(--primary-foreground)" }}>Play Games</Button>
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Next Up</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-foreground/80">
            Vocabulary: Travel phrases in {profile.language}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recommended</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-foreground/80">
            Pronunciation practice and a short culture scenario
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

export default function DashboardPage() {
  return (
    <AppProvider>
      <AppNav />
      <DashboardInner />
    </AppProvider>
  )
}
