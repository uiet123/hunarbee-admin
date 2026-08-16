"use client";

import { motion, useReducedMotion } from "framer-motion";

interface ParticleProps {
  count?: number;
  /** "light" for light sections, "dark" for navy/dark sections */
  tone?: "light" | "dark";
  className?: string;
}

const PARTICLE_CONFIGS = [
  { x: "8%", y: "15%", size: 4, delay: 0, duration: 7 },
  { x: "22%", y: "68%", size: 3, delay: 1.2, duration: 9 },
  { x: "45%", y: "25%", size: 5, delay: 0.5, duration: 8 },
  { x: "67%", y: "72%", size: 3, delay: 2.1, duration: 7.5 },
  { x: "82%", y: "38%", size: 4, delay: 0.8, duration: 10 },
  { x: "15%", y: "82%", size: 3, delay: 1.8, duration: 8.5 },
  { x: "55%", y: "52%", size: 2, delay: 3, duration: 6.5 },
  { x: "90%", y: "18%", size: 3, delay: 0.3, duration: 9.5 },
  { x: "35%", y: "90%", size: 4, delay: 2.5, duration: 7.2 },
  { x: "72%", y: "12%", size: 2, delay: 1.5, duration: 8.8 },
  { x: "5%", y: "45%", size: 3, delay: 3.5, duration: 6 },
  { x: "48%", y: "78%", size: 2, delay: 0.9, duration: 11 },
];

/** Lightweight div-based floating particles for atmospheric depth. */
export function Particles({ count = 10, tone = "light", className }: ParticleProps) {
  const reduce = useReducedMotion();
  if (reduce) return null;

  const particles = PARTICLE_CONFIGS.slice(0, Math.min(count, PARTICLE_CONFIGS.length));
  const color = tone === "dark" ? "rgba(245, 184, 0, 0.5)" : "rgba(245, 184, 0, 0.45)";

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      aria-hidden
    >
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            background: color,
            boxShadow: `0 0 ${p.size * 3}px ${color}`,
          }}
          animate={{
            y: [0, -30, -15, -40, 0],
            x: [0, 10, -8, 12, 0],
            opacity: [0.3, 0.7, 0.5, 0.8, 0.3],
            scale: [1, 1.3, 0.9, 1.2, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
