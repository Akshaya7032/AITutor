"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function useSTT() {
  const recognitionRef = useRef<any>(null)
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const [transcript, setTranscript] = useState("")

  useEffect(() => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (SR) {
      setSupported(true)
      const rec = new SR()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = "en-US"
      rec.onresult = (e: any) => {
        let t = ""
        for (let i = e.resultIndex; i < e.results.length; i++) {
          t += e.results[i][0].transcript
        }
        setTranscript(t)
      }
      rec.onend = () => setListening(false)
      recognitionRef.current = rec
    }
  }, [])

  const start = useCallback(() => {
    if (!recognitionRef.current) return
    setTranscript("")
    setListening(true)
    recognitionRef.current.start()
  }, [])

  const stop = useCallback(() => {
    if (!recognitionRef.current) return
    recognitionRef.current.stop()
  }, [])

  return { supported, listening, transcript, start, stop }
}
