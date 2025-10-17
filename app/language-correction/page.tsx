"use client"

import React, { useState, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppProvider } from "@/components/providers/app-provider"
import { AppNav } from "@/components/nav"

const VoiceRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [originalText, setOriginalText] = useState<string>("Waiting for result...")
  const [correctedText, setCorrectedText] = useState<string>("Improving with GPT...")
  const [status, setStatus] = useState<string>("Click to start recording 🎤")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // 🎙 Start or stop recording
  const handleRecord = async (): Promise<void> => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      setStatus("Processing audio...")
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event: BlobEvent) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data)
        }

        mediaRecorder.onstop = handleSendAudio

        mediaRecorder.start()
        setIsRecording(true)
        setStatus("🎙 Recording... Click again to stop")
      } catch (error) {
        console.error("Microphone access failed:", error)
        setStatus("Failed to access microphone. Check permissions.")
      }
    }
  }

  // Send audio to backend and handle response
  const handleSendAudio = async (): Promise<void> => {
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
    const formData = new FormData()
    formData.append("file", audioBlob, "recording.webm")

    setStatus("Sending to server...")
    setOriginalText("Waiting for result...")
    setCorrectedText("Improving with GPT...")

    try {
      const response = await fetch("http://127.0.0.1:8000/transcribe/", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      // Log all headers for debugging
      const headers: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })
      console.log("Response headers:", headers)

      // Check if response is audio
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("audio/wav")) {
        // Extract text data from headers
        const originalText = response.headers.get("X-Original-Text") || "No transcription available"
        const correctedText = response.headers.get("X-Corrected-Text") || "No correction available"
        const language = response.headers.get("X-Language") || "Unknown"

        setOriginalText(originalText)
        setCorrectedText(correctedText)
        setStatus(`Done! Playing audio (Language: ${language})`)

        // Handle audio playback
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        audio.play().catch((error: Error) => {
          console.error("Audio play failed:", error)
          setStatus("Done! Audio play failed. Check console.")
        })
      } else {
        // Handle unexpected response (e.g., JSON)
        try {
          const result = await response.json()
          console.log("Unexpected JSON response:", result)
          setStatus("Unexpected response format. Check console.")
          setOriginalText(result.originalText || "—")
          setCorrectedText(result.correctedText || "—")
        } catch (jsonError) {
          console.error("Failed to parse JSON response:", jsonError)
          setStatus("Invalid response format. Check console.")
          setOriginalText("—")
          setCorrectedText("—")
        }
      }
    } catch (error) {
      console.error("Upload failed:", error)
      setStatus("Upload failed. Check console.")
      setOriginalText("—")
      setCorrectedText("—")
    }
  }

  return (
    <AppProvider>
      <AppNav />
      <main className="mx-auto grid max-w-4xl gap-8 px-4 py-8">
        <section>
          <h1 className="text-3xl font-bold">Voice Recorder</h1>
          <p className="mt-2 text-foreground/80">Record your voice and get transcriptions with corrections</p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Record Audio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-border bg-background p-6 text-center">
              {isRecording ? (
                <div className="space-y-2">
                  <div
                    className="inline-block h-4 w-4 animate-pulse rounded-full"
                    style={{ background: "var(--brand-accent)" }}
                  />
                  <p className="text-sm font-semibold">Recording...</p>
                </div>
              ) : (
                <p className="text-sm text-foreground/80">{status}</p>
              )}
            </div>

            <Button
              onClick={handleRecord}
              style={{ background: "var(--brand-primary)", color: "var(--primary-foreground)" }}
              className="w-full"
              disabled={status.includes("Sending") || status.includes("Processing")}
            >
              {isRecording ? "⏹ Stop Recording" : "🎙 Start Recording"}
            </Button>

            {(originalText !== "Waiting for result..." || correctedText !== "Improving with GPT...") && (
              <div className="rounded-lg border border-border/50 bg-card/50 p-4">
                <p className="text-sm text-foreground/80">Transcription Results:</p>
                <p className="mt-2">
                  <strong>Original:</strong> {originalText}
                </p>
                <p className="mt-2">
                  <strong>Corrected:</strong>{" "}
                  <span style={{ color: "var(--brand-accent)" }}>{correctedText}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </AppProvider>
  )
}

export default VoiceRecorder