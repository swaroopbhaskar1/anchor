"use client"
import React, { useEffect, useState, useRef } from "react"
import useWebRTCAudioSession from "@/hooks/use-webrtc"
import { tools } from "@/lib/tools"
import { motion, AnimatePresence } from "framer-motion"

type CancerType = "colon" | "breast" | "lymphoma"

interface MirrorResult {
  mirror: string
  ground: string
  actions: string[]
  fearSummary: string
  fearQuote: string
}

const CANCER_TYPES: { value: CancerType; label: string }[] = [
  { value: "colon", label: "Colon" },
  { value: "breast", label: "Breast" },
  { value: "lymphoma", label: "Lymphoma" },
]

export default function App() {
  const [cancerType, setCancerType] = useState<CancerType>("colon")
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const [mirrorResult, setMirrorResult] = useState<MirrorResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<"idle" | "recording" | "processing" | "results">("idle")
  const wasActiveRef = useRef(false)

  const { isSessionActive, handleStartStopClick, conversation, status, transcriptRef } =
    useWebRTCAudioSession("ash", tools)

  useEffect(() => {
    if (wasActiveRef.current && !isSessionActive) {
      const transcript = transcriptRef.current
      transcriptRef.current = "" // reset for next session
      if (transcript.length > 20) {
        processRant(transcript)
      } else {
        setPhase("idle")
      }
    }
    wasActiveRef.current = isSessionActive
    if (isSessionActive) setPhase("recording")
  }, [isSessionActive])

  async function processRant(transcript: string) {
    setPhase("processing")
    setIsProcessing(true)
    setError(null)

    try {
      const [mirrorRes, fearRes] = await Promise.all([
        fetch("/api/mirror", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, cancerType, pathologyText: "" }),
        }),
        fetch("/api/fear", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, sessionId, contextTag: "night-note" }),
        }),
      ])

      if (!mirrorRes.ok) throw new Error("Mirror API failed")
      const mirror: MirrorResult = await mirrorRes.json()
      setMirrorResult(mirror)
      setPhase("results")
    } catch (err) {
      console.error(err)
      setError("Something went wrong. Please try again.")
      setPhase("idle")
    } finally {
      setIsProcessing(false)
    }
  }

  function reset() {
    setMirrorResult(null)
    setError(null)
    setPhase("idle")
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        color: "#e8e0d5",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "-20%",
          left: "-10%",
          width: "60%",
          height: "60%",
          background: "radial-gradient(ellipse, rgba(180,80,60,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-20%",
          right: "-10%",
          width: "50%",
          height: "50%",
          background: "radial-gradient(ellipse, rgba(60,80,180,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "60px 24px 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ marginBottom: "64px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c4614a" }} />
            <span style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c4614a", fontFamily: "monospace" }}>
              Anchor
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: "400", lineHeight: "1.2", color: "#f0e8df", margin: 0, letterSpacing: "-0.02em" }}>
            Night Note
          </h1>
          <p style={{ marginTop: "12px", fontSize: "15px", lineHeight: "1.7", color: "#8a8070", fontStyle: "italic" }}>
            Say everything you're afraid to say out loud.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ marginBottom: "48px" }}>
                <label style={{ display: "block", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#6a6058", marginBottom: "16px", fontFamily: "monospace" }}>
                  Diagnosis type
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  {CANCER_TYPES.map((ct) => (
                    <button
                      key={ct.value}
                      onClick={() => setCancerType(ct.value)}
                      style={{
                        padding: "10px 20px",
                        borderRadius: "4px",
                        border: cancerType === ct.value ? "1px solid #c4614a" : "1px solid #2a2420",
                        background: cancerType === ct.value ? "rgba(196,97,74,0.12)" : "rgba(255,255,255,0.02)",
                        color: cancerType === ct.value ? "#e8957a" : "#6a6058",
                        fontSize: "13px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        fontFamily: "Georgia, serif",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
                <button
                  onClick={handleStartStopClick}
                  style={{
                    width: "96px", height: "96px", borderRadius: "50%",
                    border: "1px solid rgba(196,97,74,0.3)",
                    background: "rgba(196,97,74,0.08)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.3s ease",
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="2" width="6" height="12" rx="3" fill="#c4614a" opacity="0.9" />
                    <path d="M5 10a7 7 0 0 0 14 0" stroke="#c4614a" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
                    <line x1="12" y1="17" x2="12" y2="21" stroke="#c4614a" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                    <line x1="9" y1="21" x2="15" y2="21" stroke="#c4614a" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                  </svg>
                </button>
                <span style={{ fontSize: "12px", color: "#4a4440", letterSpacing: "0.1em", fontFamily: "monospace", textTransform: "uppercase" }}>
                  tap to speak
                </span>
              </div>

              {error && <p style={{ textAlign: "center", color: "#c4614a", marginTop: "32px", fontSize: "14px" }}>{error}</p>}
            </motion.div>
          )}

          {phase === "recording" && (
            <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "32px" }}>
              <div style={{ fontSize: "14px", color: "#8a8070", fontStyle: "italic" }}>Listening…</div>
              <div style={{ position: "relative", width: "96px", height: "96px" }}>
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid #c4614a" }}
                />
                <button
                  onClick={handleStartStopClick}
                  style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    border: "1px solid rgba(196,97,74,0.6)", background: "rgba(196,97,74,0.15)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <div style={{ width: "16px", height: "16px", background: "#c4614a", borderRadius: "2px" }} />
                </button>
              </div>
              <span style={{ fontSize: "11px", color: "#4a4440", letterSpacing: "0.1em", fontFamily: "monospace", textTransform: "uppercase" }}>
                tap to finish
              </span>
              {conversation.filter((m) => m.role === "user" && m.text && m.text !== "Processing speech...").length > 0 && (
                <p style={{ fontSize: "14px", color: "#5a5048", fontStyle: "italic", lineHeight: "1.7", textAlign: "center", maxWidth: "420px", margin: 0 }}>
                  {conversation.filter((m) => m.role === "user" && m.text && m.text !== "Processing speech...").slice(-1)[0]?.text}
                </p>
              )}
            </motion.div>
          )}

          {phase === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", paddingTop: "40px" }}>
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{ fontSize: "13px", color: "#8a8070", letterSpacing: "0.1em", fontFamily: "monospace" }}
              >
                Anchor is listening…
              </motion.div>
            </motion.div>
          )}

          {phase === "results" && mirrorResult && (
            <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
              <div style={{ borderLeft: "2px solid rgba(196,97,74,0.4)", paddingLeft: "20px", marginBottom: "48px" }}>
                <p style={{ fontSize: "16px", fontStyle: "italic", color: "#b09080", lineHeight: "1.7", margin: 0 }}>
                  "{mirrorResult.fearQuote}"
                </p>
              </div>

              <div style={{ marginBottom: "40px" }}>
                <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#4a4440", fontFamily: "monospace", marginBottom: "14px" }}>
                  What Anchor hears
                </div>
                <p style={{ fontSize: "17px", lineHeight: "1.8", color: "#e0d4c8", margin: 0 }}>{mirrorResult.mirror}</p>
              </div>

              <div style={{ marginBottom: "40px" }}>
                <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#4a4440", fontFamily: "monospace", marginBottom: "14px" }}>
                  What's true right now
                </div>
                <p style={{ fontSize: "15px", lineHeight: "1.8", color: "#9a9080", margin: 0 }}>{mirrorResult.ground}</p>
              </div>

              {mirrorResult.actions?.length > 0 && (
                <div style={{ marginBottom: "48px" }}>
                  <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#4a4440", fontFamily: "monospace", marginBottom: "16px" }}>
                    Your next 3 moves
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {mirrorResult.actions.slice(0, 3).map((action, i) => (
                      <div key={i} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "11px", color: "#c4614a", fontFamily: "monospace", marginTop: "3px", flexShrink: 0 }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span style={{ fontSize: "14px", color: "#b0a090", lineHeight: "1.6" }}>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={reset}
                style={{
                  background: "none", border: "none", color: "#4a4440", fontSize: "12px",
                  letterSpacing: "0.1em", fontFamily: "monospace", textTransform: "uppercase",
                  cursor: "pointer", padding: 0, textDecoration: "underline", textDecorationColor: "rgba(74,68,64,0.4)",
                }}
              >
                speak again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
