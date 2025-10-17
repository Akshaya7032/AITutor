import React, { useState, useRef } from "react";
import axios from "axios";

const VoiceRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const BACKEND_URL = "http://127.0.0.1:8000/transcribe/"; // Change if deployed

  const toggleRecording = async () => {
    if (!recording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);

          // Send to FastAPI
          const formData = new FormData();
          formData.append("file", audioFile);

          setTranscript({ original_transcript: "Processing...", corrected_transcript: "" });

          try {
            const res = await axios.post(BACKEND_URL, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            setTranscript(res.data);
          } catch (error) {
            console.error("Transcription failed:", error);
            setTranscript({
              original_transcript: "❌ Error transcribing audio",
              corrected_transcript: "",
            });
          }
        };

        mediaRecorder.start();
        setRecording(true);
      } catch (err) {
        console.error("Microphone access denied:", err);
        alert("Please allow microphone access to record audio.");
      }
    } else {
      // Stop recording
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div
      style={{
        textAlign: "center",
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2>🎧 Virtual AI Language Coach</h2>
      <p>Click below to start or stop recording your speech.</p>

      <button
        onClick={toggleRecording}
        style={{
          backgroundColor: recording ? "#d9534f" : "#5cb85c",
          color: "white",
          padding: "12px 25px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          marginBottom: "1rem",
        }}
      >
        {recording ? "🛑 Stop Recording" : "🎙️ Start Recording"}
      </button>

      {audioUrl && (
        <div style={{ marginTop: "1rem" }}>
          <p>🎵 Playback:</p>
          <audio src={audioUrl} controls />
        </div>
      )}

      {transcript && (
        <div
          style={{
            background: "#f9f9f9",
            borderRadius: "10px",
            padding: "1rem",
            marginTop: "1.5rem",
            width: "80%",
            marginLeft: "auto",
            marginRight: "auto",
            textAlign: "left",
          }}
        >
          <h3>🗒️ Transcription Results:</h3>
          <p>
            <strong>Original:</strong>{" "}
            {transcript.original_transcript || "Waiting for result..."}
          </p>
          <p>
            <strong>Corrected:</strong>{" "}
            {transcript.corrected_transcript || "Improving with GPT..."}
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
