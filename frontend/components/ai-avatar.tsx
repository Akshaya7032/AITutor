"use client"

import { motion } from "framer-motion"

/**
 * Holographic-style AI avatar:
 * - Animated shimmering ring
 * - Floating bokeh particles
 * - Reacts to "speaking" via prop
 */
export function AIAvatar({ speaking = false }: { speaking?: boolean }) {
  return (
    <div
      className="relative mx-auto aspect-square w-40 select-none overflow-hidden rounded-full"
      aria-label="AI Tutor Avatar"
      role="img"
    >
      {/* shimmering core */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 50%, var(--brand-primary) 0%, transparent 60%), radial-gradient(40% 40% at 70% 35%, var(--brand-accent) 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
        animate={{ rotate: speaking ? 360 : 0, scale: speaking ? 1.05 : 1 }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />

      {/* outline ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow:
            "0 0 0 2px color-mix(in oklch, var(--brand-primary) 70%, transparent), 0 0 24px var(--brand-primary)",
        }}
        animate={{ opacity: speaking ? 1 : 0.7 }}
        transition={{ duration: 0.4 }}
      />

      {/* subtle avatar silhouette */}
      <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
        <div
          className="h-20 w-20 rounded-full"
          style={{
            backdropFilter: "blur(6px)",
            background: "linear-gradient(180deg, color-mix(in oklch, white 10%, transparent), transparent)",
            border: "1px solid color-mix(in oklch, white 20%, transparent)",
          }}
        />
      </div>

      {/* bokeh particles */}
      {[...Array(10)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute block rounded-full"
          style={{
            width: 6,
            height: 6,
            left: `${10 + ((i * 80) % 80)}%`,
            top: `${(i * 33) % 80}%`,
            background: i % 2 === 0 ? "var(--brand-accent)" : "var(--brand-warn)",
            filter: "blur(0.5px)",
          }}
          animate={{ y: [0, -8, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2 + (i % 4), repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}
