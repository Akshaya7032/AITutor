"use client"

import { useCallback, useState } from "react"

export function useTTS() {
  const [speaking, setSpeaking] = useState(false)

  const speak = useCallback((text: string, lang = "en-US") => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.onstart = () => setSpeaking(true)
    u.onend = () => setSpeaking(false)
    window.speechSynthesis.speak(u)
  }, [])

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  return { speak, cancel, speaking }
}
