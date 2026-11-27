'use client';

import React from 'react';
import { MoonPhase } from '@/types/lunova';

interface PhaseGlyphProps {
  phase: MoonPhase;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
  glow?: boolean;
}

const SIZE_MAP = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 32,
  xl: 48,
};

const PHASE_LABELS: Record<MoonPhase, string> = {
  new: 'New Received',
  extracting: 'Extracting Requirements',
  drafting: 'AI Drafting with Evidence',
  in_review: 'In Review',
  approved: 'Approved for Dispatch',
  blocked: 'Missing Evidence Flagged',
};

export const PhaseGlyph: React.FC<PhaseGlyphProps> = ({
  phase,
  size = 'md',
  showLabel = false,
  className = '',
  glow = true,
}) => {
  const px = SIZE_MAP[size];

  // SVG Moon Phase Geometry on a 24x24 viewport
  const renderGlyph = () => {
    switch (phase) {
      case 'new':
        // Thin crescent outline
        return (
          <svg
            width={px}
            height={px}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-text-muted transition-transform duration-200"
            aria-label="New Proposal - Crescent Outline"
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.25" strokeDasharray="2 3" opacity="0.4" />
            <path
              d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C9.5 18.5 8 15.5 8 12C8 8.5 9.5 5.5 12 3Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        );

      case 'extracting':
        // Waxing crescent with slow shimmer
        return (
          <svg
            width={px}
            height={px}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`text-accent animate-moon-shimmer ${glow ? 'drop-shadow-[0_0_6px_var(--accent-glow)]' : ''}`}
            aria-label="Extracting - Waxing Crescent Shimmer"
          >
            <circle cx="12" cy="12" r="9" stroke="var(--line)" strokeWidth="1" opacity="0.3" />
            <path
              d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C9.2 18 7.5 15.2 7.5 12C7.5 8.8 9.2 6 12 3Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        );

      case 'drafting':
        // First quarter, pulsing edge
        return (
          <svg
            width={px}
            height={px}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`text-accent ${glow ? 'drop-shadow-[0_0_8px_var(--accent-glow)]' : ''}`}
            aria-label="Drafting - First Quarter"
          >
            <circle cx="12" cy="12" r="9" stroke="var(--line)" strokeWidth="1.2" opacity="0.4" />
            <path
              d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21V3Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1"
            />
            {/* Subtle inner phase arc */}
            <path d="M12 3.5V20.5" stroke="var(--bg)" strokeWidth="1" />
          </svg>
        );

      case 'in_review':
        // Gibbous moon (mostly illuminated)
        return (
          <svg
            width={px}
            height={px}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`text-accent ${glow ? 'drop-shadow-[0_0_8px_var(--accent-glow)]' : ''}`}
            aria-label="In Review - Waxing Gibbous"
          >
            <circle cx="12" cy="12" r="9" stroke="var(--line)" strokeWidth="1" opacity="0.3" />
            <path
              d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C8 18 5 15.2 5 12C5 8.8 8 6 12 3Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="0.8"
            />
          </svg>
        );

      case 'approved':
        // Full moon with soft warm glow
        return (
          <svg
            width={px}
            height={px}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`text-evidence ${glow ? 'drop-shadow-[0_0_10px_rgba(79,209,181,0.4)]' : ''}`}
            aria-label="Approved - Full Moon"
          >
            <circle cx="12" cy="12" r="9" fill="currentColor" />
            {/* Delicate inner lunar maria texture */}
            <circle cx="9.5" cy="10" r="1.5" fill="var(--surface-1)" opacity="0.25" />
            <circle cx="14" cy="13.5" r="2" fill="var(--surface-1)" opacity="0.25" />
            <circle cx="15" cy="8.5" r="1.2" fill="var(--surface-1)" opacity="0.2" />
          </svg>
        );

      case 'blocked':
        // Eclipse ring with coral edge
        return (
          <svg
            width={px}
            height={px}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`text-gap animate-eclipse-pulse ${glow ? 'drop-shadow-[0_0_8px_rgba(255,122,102,0.4)]' : ''}`}
            aria-label="Blocked / Missing Evidence - Eclipse Ring"
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" />
            <circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.15" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
        );
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
        {renderGlyph()}
      </div>
      {showLabel && (
        <span className="text-xs font-medium tracking-tight whitespace-nowrap">
          {PHASE_LABELS[phase]}
        </span>
      )}
    </div>
  );
};
