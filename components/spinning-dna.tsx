"use client";

import { cn } from "@/lib/utils";

type SpinningDnaProps = {
  className?: string;
  /** Visual scale — default fits loading overlays */
  size?: "md" | "lg";
};

const RUNGS = 18;

export function SpinningDna({ className, size = "md" }: SpinningDnaProps) {
  const vbW = 100;
  const vbH = 200;
  const svgClass = size === "lg" ? "h-52 w-28" : "h-44 w-24";

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ perspective: "560px" }}
    >
      <div className="animate-dna-helix" style={{ transformStyle: "preserve-3d" }}>
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          className={cn("overflow-visible", svgClass)}
          aria-hidden
        >
          {Array.from({ length: RUNGS }, (_, i) => {
            const y = 14 + (i / (RUNGS - 1)) * (vbH - 28);
            const phase = (i / RUNGS) * Math.PI * 2.6;
            const x1 = vbW / 2 + Math.sin(phase) * 27;
            const x2 = vbW / 2 - Math.sin(phase) * 27;
            return (
              <g key={i}>
                <line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke="rgba(56, 189, 248, 0.38)"
                  strokeWidth={1.15}
                  strokeLinecap="round"
                />
                <circle
                  cx={x1}
                  cy={y}
                  r={3.35}
                  fill="rgb(56, 189, 248)"
                  style={{ filter: "drop-shadow(0 0 5px rgba(56,189,248,0.75))" }}
                />
                <circle
                  cx={x2}
                  cy={y}
                  r={3.35}
                  fill="rgb(103, 232, 249)"
                  opacity={0.9}
                  style={{ filter: "drop-shadow(0 0 4px rgba(103,232,249,0.65))" }}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
