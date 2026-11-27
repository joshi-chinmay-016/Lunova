'use client';

import React from 'react';

interface ConfidenceRingProps {
  score: number; // 0 to 100
  size?: number; // px diameter
  strokeWidth?: number;
  showText?: boolean;
  className?: string;
}

export const ConfidenceRing: React.FC<ConfidenceRingProps> = ({
  score,
  size = 32,
  strokeWidth = 3,
  showText = true,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Threshold colors
  let color = 'var(--evidence)'; // >= 90%
  if (clampedScore < 70) {
    color = 'var(--gap)'; // < 70%
  } else if (clampedScore < 90) {
    color = 'var(--accent)'; // 70-89%
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title={`Confidence Score: ${clampedScore}%`}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90 transform"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--line)"
          strokeWidth={strokeWidth}
          fill="transparent"
          opacity={0.4}
        />
        {/* Animated value arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showText && (
        <span
          className="absolute text-[10px] font-mono font-bold tabular-nums"
          style={{ color }}
        >
          {clampedScore}%
        </span>
      )}
    </div>
  );
};
