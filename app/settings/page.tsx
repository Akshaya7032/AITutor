"use client"

import { AppNav } from "@/components/nav"
import { AppProvider, useApp } from "@/components/providers/app-provider"
import { Button } from "@/components/ui/button"

function SettingsInner() {
  const { profile, setLanguage, setProficiency } = useApp()

  return (
    <main className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
      <section className="rounded-lg border border-border/50 bg-card p-5">
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-foreground/80">Adjust preferences and accessibility.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border/50 bg-card p-5">
          <h2 className="text-sm font-semibold">Language</h2>
          <label className="sr-only" htmlFor="language">
            Select language
          </label>
          <select
            id="language"
            className="mt-2 w-full rounded-md border border-border bg-background p-2 text-sm"
            value={profile.language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option>French</option>
            <option>Japanese</option>
            <option>Spanish</option>
            <option>German</option>
          </select>
        </div>

        <div className="rounded-lg border border-border/50 bg-card p-5">
          <h2 className="text-sm font-semibold">Proficiency</h2>
          <label className="sr-only" htmlFor="proficiency">
            Select proficiency
          </label>
          <select
            id="proficiency"
            className="mt-2 w-full rounded-md border border-border bg-background p-2 text-sm"
            value={profile.proficiency}
            onChange={(e) => setProficiency(e.target.value as any)}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
      </section>

      <section className="rounded-lg border border-border/50 bg-card p-5">
        <h2 className="text-sm font-semibold">Theme</h2>
        <p className="mt-1 text-sm text-foreground/80">Dark theme is enabled by default for optimal contrast.</p>
        <div className="mt-3">
          <Button
            variant="outline"
            onClick={() => {
              const html = document.documentElement
              html.classList.toggle("dark")
            }}
            aria-label="Toggle dark mode"
          >
            Toggle Dark Mode
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-border/50 bg-card p-5">
        <h2 className="text-sm font-semibold">Accessibility</h2>
        <ul className="mt-2 list-inside list-disc text-sm text-foreground/80">
          <li>Keyboard navigable controls</li>
          <li>High-contrast color scheme</li>
          <li>Screen reader friendly labels</li>
        </ul>
      </section>
    </main>
  )
}

export default function SettingsPage() {
  return (
    <AppProvider>
      <AppNav />
      <SettingsInner />
    </AppProvider>
  )
}
