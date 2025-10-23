"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

type Option = { id: string; text: string; correct?: boolean }

export function QuizCard({
  prompt,
  options,
}: {
  prompt: string
  options: Option[]
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!correct) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const particles = Array.from({ length: 80 }).map(() => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * -6 - 2,
      life: 60 + Math.random() * 30,
      color: Math.random() > 0.5 ? "var(--brand-accent)" : "var(--brand-warn)",
    }))

    let frame = 0
    const tick = () => {
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.15
        p.life -= 1
        ctx.fillStyle = p.color as any
        ctx.fillRect(p.x, p.y, 3, 3)
      })
      frame++
      if (frame < 90) requestAnimationFrame(tick)
    }
    tick()
  }, [correct])

  const onChoose = useCallback(
    (id: string) => {
      setSelected(id)
      const opt = options.find((o) => o.id === id)
      setCorrect(!!opt?.correct)
    },
    [options],
  )

  return (
    <div className="relative overflow-hidden rounded-lg border border-border/50 bg-card p-4">
      <canvas
        ref={canvasRef}
        width={320}
        height={180}
        className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-50"
        aria-hidden="true"
      />
      <div className="relative z-10">
        <p className="mb-3 text-pretty text-sm text-foreground/90">{prompt}</p>
        <div className="grid gap-2">
          {options.map((o) => {
            const isSelected = selected === o.id
            const isCorrect = correct && o.correct
            return (
              <Button
                key={o.id}
                onClick={() => onChoose(o.id)}
                className="justify-start font-normal"
                style={{
                  background: isSelected
                    ? isCorrect
                      ? "color-mix(in oklch, var(--brand-accent) 30%, transparent)"
                      : "color-mix(in oklch, var(--brand-warn) 20%, transparent)"
                    : "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
                aria-pressed={isSelected}
                aria-label={`Answer option: ${o.text}`}
              >
                {o.text}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
