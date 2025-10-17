"use client"

import { useEffect, useRef, useState } from "react"
import { AppNav } from "@/components/nav"
import { AppProvider } from "@/components/providers/app-provider"
import { AIAvatar } from "@/components/ai-avatar"
import { Button } from "@/components/ui/button"
import { useSTT } from "@/hooks/use-stt"
import { useTTS } from "@/hooks/use-tts"

type Msg = { role: "user" | "assistant"; text: string }

function ChatPanel() {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", text: "Bonjour! Let’s practice ordering coffee." }])
  const [input, setInput] = useState("")
  const listRef = useRef<HTMLDivElement | null>(null)
  const { supported: sttSupported, listening, transcript, start, stop } = useSTT()
  const { speak, speaking } = useTTS()

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [msgs.length])

  useEffect(() => {
    if (listening) setInput(transcript)
  }, [transcript, listening])

  const send = () => {
    if (!input.trim()) return
    const user = { role: "user", text: input } as Msg
    setMsgs((m) => [...m, user])
    setInput("")

    // Placeholder AI response
    const reply: Msg = {
      role: "assistant",
      text: "Great try! Remember articles: 'un café', 'une baguette'.",
    }
    setTimeout(() => {
      setMsgs((m) => [...m, reply])
      speak(reply.text, "fr-FR")
    }, 400)
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tutor Session</h1>
        <AIAvatar speaking={speaking} />
      </div>

      <div
        ref={listRef}
        className="h-[50vh] overflow-y-auto rounded-lg border border-border/50 bg-card p-4"
        role="log"
        aria-live="polite"
      >
        <ul className="grid gap-3">
          {msgs.map((m, i) => (
            <li key={i} className="grid" style={{ justifyContent: m.role === "user" ? "end" : "start" }}>
              <span
                className="max-w-[80%] rounded-md px-3 py-2 text-sm"
                style={{
                  background:
                    m.role === "user"
                      ? "color-mix(in oklch, var(--brand-primary) 20%, transparent)"
                      : "color-mix(in oklch, var(--brand-accent) 15%, transparent)",
                  border: "1px solid var(--border)",
                }}
              >
                {m.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <label className="sr-only" htmlFor="chat-input">
          Message
        </label>
        <input
          id="chat-input"
          className="min-w-0 rounded-md border border-border bg-background px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Type or use the mic…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button onClick={send} style={{ background: "var(--brand-primary)", color: "var(--primary-foreground)" }}>
          Send
        </Button>
        <Button
          variant="outline"
          onClick={listening ? stop : start}
          aria-pressed={listening}
          aria-label={listening ? "Stop microphone" : "Start microphone"}
          disabled={!sttSupported}
          title={sttSupported ? "" : "Speech recognition not supported in this browser"}
        >
          {listening ? "Stop Mic" : "Start Mic"}
        </Button>
      </div>

      <style jsx>{`
        :global(#chat-input::placeholder) {
          color: color-mix(in oklch, var(--foreground) 55%, transparent);
        }
      `}</style>
    </div>
  )
}

export default function ChatPage() {
  return (
    <AppProvider>
      <AppNav />
      <ChatPanel />
    </AppProvider>
  )
}
