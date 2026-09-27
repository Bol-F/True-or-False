"use client";

import { motion, useReducedMotion } from "framer-motion";

export interface ConfidenceRingProps {
  value: number;
  label?: string;
  tone: "fake" | "real";
}

const RADIUS = 51;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const toneStyles = {
  fake: {
    track: "#f3cfcc",
    stroke: "#d94347",
    text: "#122f50",
    glow: "rgba(217, 67, 71, 0.12)",
  },
  real: {
    track: "#d8e7da",
    stroke: "#3d8151",
    text: "#173f2a",
    glow: "rgba(61, 129, 81, 0.12)",
  },
} as const;

export function ConfidenceRing({
  value,
  label = "уверенность модели",
  tone,
}: ConfidenceRingProps) {
  const prefersReducedMotion = useReducedMotion();
  const normalizedValue = Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : 0;
  const percentage = Math.round(normalizedValue * 100);
  const colors = toneStyles[tone];

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
      aria-valuetext={`${percentage}% — ${label}`}
      className="relative grid h-28 w-28 shrink-0 place-items-center justify-self-center sm:h-32 sm:w-32 sm:justify-self-auto"
    >
      <div
        aria-hidden="true"
        className="absolute inset-[13px] rounded-full bg-[radial-gradient(circle_at_38%_28%,#ffffff_0%,#fcf8f4_72%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.72)]"
        style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,.72), 0 7px 20px ${colors.glow}` }}
      />

      <svg
        viewBox="0 0 128 128"
        className="absolute inset-0 h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="64"
          cy="64"
          r={RADIUS}
          fill="none"
          stroke={colors.track}
          strokeWidth="10"
        />
        <motion.circle
          key={`${tone}-${percentage}`}
          cx="64"
          cy="64"
          r={RADIUS}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{
            strokeDashoffset: CIRCUMFERENCE * (1 - normalizedValue),
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.95,
            delay: prefersReducedMotion ? 0 : 0.12,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      </svg>

      <div className="relative z-10 flex max-w-[82px] flex-col items-center text-center">
        <span
          className="text-[27px] leading-none font-extrabold tracking-[-0.045em] tabular-nums"
          style={{ color: colors.text }}
          aria-hidden="true"
        >
          {percentage}%
        </span>
        <span
          className="mt-1 text-[10px] leading-[1.25] font-medium text-[#69768a]"
          aria-hidden="true"
        >
          {label}
        </span>
      </div>
    </div>
  );
}
