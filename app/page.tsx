"use client"

import Link from "next/link"
import { AppNav } from "@/components/nav"
import { Button } from "@/components/ui/button"
import { AIAvatar } from "@/components/ai-avatar"
import { AppProvider } from "@/components/providers/app-provider"

export default function HomePage() {
  return (
    <AppProvider>
      <AppNav />

      <main className="relative mx-auto grid max-w-6xl gap-10 px-4 py-10">
        {/* Hero */}
        <section
          className="relative overflow-hidden rounded-xl border border-border/50 p-6 md:p-10"
          aria-labelledby="hero-title"
        >
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(100% 60% at 10% 0%, color-mix(in oklch, var(--brand-primary) 15%, transparent), transparent), radial-gradient(100% 60% at 100% 100%, color-mix(in oklch, var(--brand-accent) 12%, transparent), transparent)",
            }}
          />
          <div className="relative z-10 grid items-center gap-8 md:grid-cols-2">
            <div>
              <h1 id="hero-title" className="text-balance text-3xl font-semibold leading-tight md:text-5xl">
                Speak Fluently with Your AI Tutor
              </h1>
              <p className="mt-3 max-w-prose text-pretty text-foreground/80 md:text-lg">
                Real-time conversations, grammar feedback, and personalized learning paths. Practice, improve, and track
                your progress with an energetic, motivating interface.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href="/chat">
                  <Button
                    className="px-5 py-6 text-base"
                    style={{
                      background: "var(--brand-primary)",
                      color: "var(--primary-foreground)",
                    }}
                    aria-label="Start a tutoring session"
                  >
                    Start a Session
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    className="px-5 py-6 text-base bg-transparent"
                    aria-label="View your dashboard"
                  >
                    View Dashboard
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid place-items-center">
              <AIAvatar speaking={true} />
              <p className="mt-3 text-center text-xs text-foreground/70">Holographic AI avatar reacts to your voice</p>
            </div>
          </div>

          <style jsx>{`
            section {
              background:
                linear-gradient(
                  180deg,
                  color-mix(in oklch, black 30%, transparent),
                  transparent
                );
            }
          `}</style>
        </section>

        {/* Highlights */}
        <section aria-labelledby="features-title" className="grid gap-4 md:grid-cols-3">
          <h2 id="features-title" className="sr-only">
            Features
          </h2>
          {[
            {
              title: "Interactive Conversations",
              desc: "Practice with real-time AI dialogue, speech-to-text input and text-to-speech feedback.",
            },
            {
              title: "Personalized Learning",
              desc: "Adaptive paths, daily goals, and clear milestones keep you motivated.",
            },
            {
              title: "Gamified Progress",
              desc: "Earn badges, take quizzes, and watch your skills grow with vivid charts.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border border-border/50 bg-card p-5">
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-foreground/80">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </AppProvider>
  )
}
