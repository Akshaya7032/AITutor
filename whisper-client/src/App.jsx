import React from "react";
import VoiceRecorder from "../src/VoiceRecorder";
import LiquidEther from "../src/components/LiquidEther";

function App() {
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f0f1a",
        color: "#fff",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* 🔵 LiquidEther Full Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
        }}
      >
        <LiquidEther
          colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>

      {/* 🎙 Recorder Card (on top of background) */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(12px)",
          padding: "30px 50px",
          maxWidth: "480px",
          width: "90%",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: "15px", fontWeight: "600", fontSize: "1.5rem" }}>
          🎤 Voice Recorder
        </h2>
        <VoiceRecorder />
      </div>
    </div>
  );
}

export default App;
