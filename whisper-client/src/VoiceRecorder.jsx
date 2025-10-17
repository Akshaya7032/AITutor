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
      setStatus("⏳ Processing audio...");
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

  // 🚀 Send audio to backend
  const handleSendAudio = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    setStatus("🪶 Sending to server...");
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

      const result = await response.json();
      console.log("✅ Backend Response:", result);

      if (result.original && result.corrected) {
        setOriginalText(result.original);
        setCorrectedText(result.corrected);
        setStatus("✅ Done! Check below 👇");
      } else if (result.error) {
        setStatus("❌ Error during transcription.");
        setOriginalText("—");
        setCorrectedText(result.error);
      } else {
        setStatus("⚠️ Unexpected response format.");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setStatus("❌ Upload failed. Check console.");
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
        <h3>🗒️ Transcription Results:</h3>
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
