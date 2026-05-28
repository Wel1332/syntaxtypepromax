"use client"

import React, { useState, useEffect } from "react"
import { useTheme } from "@mui/material"
import SyntaxSaverLesson from "./SyntaxSaverLesson"
import FourPicsGame from "./FourPicsGame"
import Crossword from "./CrosswordGame.js"

// ── Design tokens — light + dark variants ────────────────────────────────────
const LIGHT = {
  ink: "#1a1a2e",
  paper: "#f5f0e8",
  paperDark: "#ede7d9",
  paperMid: "#ddd5c5",
  cardBg: "#ffffff",
  textPrimary: "#1a1a2e",
  textSecondary: "#888888",
  descText: "#999999",
  accent: "#e8622a",
  accentDim: "#c44e1e",
  green: "#2d7a3a",
  blue: "#2563a8",
  amber: "#b45309",
  purple: "#7c3aed",
}

const DARK = {
  ink: "#FFF8F0",                // light text now is the "ink" on dark bg
  paper: "#0f0f1a",              // page bg
  paperDark: "#1a1a2e",
  paperMid: "#2a2a3f",           // borders/shadows
  cardBg: "#1a1a2e",             // card surface
  textPrimary: "#FFF8F0",
  textSecondary: "#9aa0b4",
  descText: "#888fa3",
  accent: "#FFC700",             // gold accent (matches Galaxy/Landing)
  accentDim: "#C8456D",          // pink shadow (matches Landing palette)
  green: "#4ade80",
  blue: "#60a5fa",
  amber: "#fbbf24",
  purple: "#a78bfa",
}

// ── Boot fonts + animations (same as dashboard) ───────────────────────────────
function boot() {
  if (!document.getElementById("st-fonts")) {
    const l = document.createElement("link")
    l.id = "st-fonts"
    l.rel = "stylesheet"
    l.href =
      "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;700&display=swap"
    document.head.appendChild(l)
  }

  if (!document.getElementById("quiz-kf")) {
    const s = document.createElement("style")
    s.id = "quiz-kf"
    s.textContent = `
      @keyframes fadeUp {
        from { opacity:0; transform:translateY(16px) }
        to   { opacity:1; transform:translateY(0) }
      }
    `
    document.head.appendChild(s)
  }
}

// ── Difficulty → label + dots (color picked from T per render) ───────────────
const DIFFICULTY = {
  easy:   { label: "EASY",   dots: "●○○", colorKey: "green" },
  medium: { label: "MEDIUM", dots: "●●○", colorKey: "amber" },
  hard:   { label: "HARD",   dots: "●●●", colorKey: "purple" },
}

// ── Quiz Card (Dashboard-style ModuleCard clone) ──────────────────────────────
function QuizCard({ icon, title, desc, difficulty, onClick, delay, T }) {
  const [hov, setHov] = useState(false)
  const d = DIFFICULTY[difficulty] || DIFFICULTY.easy
  const color = T[d.colorKey]
  const isDark = T === DARK
  const hoverBg = isDark ? "#2a2a3f" : T.ink

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        cursor: "pointer",
        borderRadius: 16,
        padding: "20px 18px",
        background: hov ? hoverBg : T.cardBg,
        border: `2px solid ${hov ? (isDark ? T.accent : T.ink) : T.paperMid}`,
        boxShadow: hov
          ? `0 8px 0 ${T.accentDim}, 0 12px 30px rgba(0,0,0,.35)`
          : `0 4px 0 ${T.paperMid}`,
        transform: hov ? "translateY(-5px) scale(1.01)" : "none",
        transition: "all .2s cubic-bezier(.34,1.56,.64,1)",
        animation: `fadeUp .4s ease ${delay}s both`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* difficulty chip */}
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          padding: "3px 10px",
          borderRadius: 99,
          background: color + "22",
          color: hov ? "#fff" : color,
          border: `1px solid ${color}`,
          width: "fit-content",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          letterSpacing: 1,
          fontWeight: 700,
        }}
      >
        <span style={{ fontSize: 8, letterSpacing: 1 }}>{d.dots}</span>
        {d.label}
      </span>

      {/* icon */}
      <div style={{ height: 72, display: "flex", alignItems: "center" }}>
        {typeof icon === "string" && icon.startsWith("/") ? (
          <img
            src={icon}
            alt=""
            width={64}
            height={64}
            style={{
              imageRendering: "pixelated",
              objectFit: "contain",
              filter: hov ? "drop-shadow(0 3px 0 rgba(0,0,0,0.45))" : "drop-shadow(0 2px 0 rgba(0,0,0,0.15))",
              transition: "filter .2s",
            }}
          />
        ) : (
          <div style={{ fontSize: "2rem" }}>{icon}</div>
        )}
      </div>

      {/* title */}
      <div
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 9,
          color: hov ? T.paper : T.textPrimary,
          lineHeight: 1.6,
        }}
      >
        {title}
      </div>

      {/* desc */}
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: hov ? (isDark ? "#a8b0c4" : "#7a8fa6") : T.descText,
        }}
      >
        {desc}
      </div>

      {/* play text */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          right: 16,
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 9,
          color: T.accent,
          opacity: hov ? 1 : 0,
          transform: hov ? "translateX(0)" : "translateX(8px)",
          transition: "all .2s",
        }}
      >
        ▶ PLAY
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function QuizMenu() {
  const [selected, setSelected] = useState(null)
  const muiTheme = useTheme()
  const isDark = muiTheme.palette.mode === "dark"
  const T = isDark ? DARK : LIGHT

  useEffect(() => boot(), [])

  if (selected === "syntax") {
    return <SyntaxSaverLesson onBack={() => setSelected(null)} />
  }
  if (selected === "fourpics") {
    return <FourPicsGame onBack={() => setSelected(null)} />
  }
  if (selected === "crossword") {
    return <Crossword onBack={() => setSelected(null)} />
  }

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: T.paper,
        minHeight: "100vh",
        padding: "40px 24px",
        color: T.textPrimary,
      }}
    >
      {/* Header */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 12,
            color: T.textPrimary,
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: 0,
          }}
        >
          <img
            src="/assets/icons/controller.png"
            alt=""
            width={32}
            height={32}
            style={{
              imageRendering: "pixelated",
              objectFit: "contain",
              filter: isDark
                ? "drop-shadow(0 2px 0 rgba(0,0,0,0.6))"
                : "drop-shadow(0 2px 0 rgba(0,0,0,0.2))",
            }}
          />
          Quiz Games
        </h2>

        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: T.textSecondary,
            marginTop: 6,
          }}
        >
          Select a challenge and test your coding knowledge.
        </p>

        {/* Grid */}
        <div
          style={{
            marginTop: 24,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          <QuizCard
            icon="/assets/icons/codeassembly.png"
            title="Code Block Assembly"
            desc="Arrange code into correct logic."
            difficulty="medium"
            delay={0}
            onClick={() => setSelected("syntax")}
            T={T}
          />

          <QuizCard
            icon="/assets/icons/4pic1word.png"
            title="4 Pics 1 Word"
            desc="Guess the coding concept."
            difficulty="easy"
            delay={0.05}
            onClick={() => setSelected("fourpics")}
            T={T}
          />

          <QuizCard
            icon="/assets/icons/crossword.png"
            title="Crossword"
            desc="Solve programming clues."
            difficulty="hard"
            delay={0.1}
            onClick={() => setSelected("crossword")}
            T={T}
          />
        </div>
      </div>
    </div>
  )
}
