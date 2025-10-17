import React, { useState, useRef } from "react";

function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [originalText, setOriginalText] = useState("Waiting for result...");
  const [correctedText, setCorrectedText] = useState("Improving with GPT...");
  const [status, setStatus] = useState("Click to start recording 🎤");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // 🎙 Start or stop recording
  const handleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatus("Processing audio...");
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = handleSendAudio;

      mediaRecorder.start();
      setIsRecording(true);
      setStatus("🎙 Recording... Click again to stop");
    }
  };

  // Send audio to backend and handle response
  const handleSendAudio = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    setStatus("Sending to server...");
    setOriginalText("Waiting for result...");
    setCorrectedText("Improving with GPT...");

    try {
      const response = await fetch("http://127.0.0.1:8000/transcribe/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Check if response is audio
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("audio/wav")) {
        // Extract text data from headers
        const originalText = response.headers.get("X-Original-Text") || "No transcription";
        const correctedText = response.headers.get("X-Corrected-Text") || "No correction";
        const language = response.headers.get("X-Language") || "Unknown";

        setOriginalText(originalText);
        setCorrectedText(correctedText);
        setStatus(`Done! Playing audio (Language: ${language})`);

        // Handle audio playback
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play().catch((error) => {
          console.error("Audio play failed:", error);
          setStatus("Done! Audio play failed. Check console.");
        });
      } else {
        // Fallback for unexpected JSON (though backend should return audio)
        const result = await response.json();
        console.log("Unexpected JSON response:", result);
        setStatus("Unexpected response format.");
        setOriginalText("—");
        setCorrectedText("—");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setStatus("Upload failed. Check console.");
    }
  };

  return (
    <div
      style={{
        textAlign: "center",
        color: "white",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <button
        onClick={handleRecord}
        style={{
          padding: "15px 40px",
          fontSize: "1.2rem",
          fontWeight: "bold",
          backgroundColor: isRecording ? "#ff4d4d" : "#4CAF50",
          border: "none",
          borderRadius: "50px",
          color: "white",
          cursor: "pointer",
          transition: "all 0.3s ease",
        }}
      >
        {isRecording ? "⏹ Stop Recording" : "🎙 Start Recording"}
      </button>

      <p style={{ marginTop: "20px", fontSize: "1rem" }}>{status}</p>

      <div
        style={{
          background: "rgba(255,255,255,0.1)",
          borderRadius: "12px",
          padding: "20px",
          marginTop: "30px",
        }}
      >
        <h3>Transcription Results:</h3>
        <p>
          <strong>Original:</strong> {originalText}
        </p>
        <p>
          <strong>Corrected:</strong> {correctedText}
        </p>
      </div>
    </div>
  );
}

export default VoiceRecorder;