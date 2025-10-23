"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const routes = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chat", label: "Tutor" },
  { href: "/exercises", label: "Exercises" },
  { href: "/games", label: "Games" },
  { href: "/language-correction", label: "Correction" },
  { href: "/settings", label: "Settings" },
]

export function AppNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <nav aria-label="Main Navigation" className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="group inline-flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: "var(--brand-accent)" }}
          />
          <span className="text-balance text-lg font-semibold tracking-tight">AI-Tutor</span>
        </Link>

        <ul className="hidden items-center gap-2 md:flex">
          {routes.map((r) => (
            <li key={r.href}>
              <Link
                href={r.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  pathname === r.href
                    ? "bg-secondary text-foreground"
                    : "text-foreground/80 hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                {r.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link href="/chat">
            <Button
              className="font-medium"
              style={{
                background: "var(--brand-primary)",
                color: "var(--primary-foreground)",
              }}
            >
              Start Now
            </Button>
          </Link>
        </div>
      </nav>

      <style jsx>{`
        header :global(a:focus-visible) {
          outline-offset: 2px;
        }
      `}</style>
    </header>
  )
}
