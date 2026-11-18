'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface VariableProximityProps {
  label: string;
  fromFontVariationSettings?: string;
  toFontVariationSettings?: string;
  radius?: number;
  falloff?: 'linear' | 'exponential' | 'gaussian';
  className?: string;
  containerClassName?: string;
}

export const VariableProximity: React.FC<VariableProximityProps> = ({
  label,
  fromFontVariationSettings = "'wght' 400, 'opsz' 24",
  toFontVariationSettings = "'wght' 700, 'opsz' 48",
  radius = 120,
  falloff = 'gaussian',
  className = '',
  containerClassName = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion || !containerRef.current) return;

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      letterRefs.current.forEach((span) => {
        if (!span) return;
        const rect = span.getBoundingClientRect();
        const letterCenterX = rect.left + rect.width / 2;
        const letterCenterY = rect.top + rect.height / 2;

        const distance = calculateDistance(mouseX, mouseY, letterCenterX, letterCenterY);

        if (distance < radius) {
          let factor = 1 - distance / radius;
          if (falloff === 'exponential') factor = factor ** 2;
          if (falloff === 'gaussian') factor = Math.exp(-((distance / (radius / 2)) ** 2));

          // Interpolate weight between 400 and 700
          const weight = Math.round(400 + factor * 300);
          const opsz = Math.round(24 + factor * 24);
          span.style.fontVariationSettings = `'wght' ${weight}, 'opsz' ${opsz}`;
          span.style.color = factor > 0.4 ? '#171817' : '#2D302D';
        } else {
          span.style.fontVariationSettings = fromFontVariationSettings;
          span.style.color = '';
        }
      });
    },
    [falloff, fromFontVariationSettings, radius, reducedMotion]
  );

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    letterRefs.current.forEach((span) => {
      if (span) {
        span.style.fontVariationSettings = fromFontVariationSettings;
        span.style.color = '';
      }
    });
  }, [fromFontVariationSettings]);

  // Split label into words and letters for natural wrapping
  const words = label.split(' ');
  let letterIndex = 0;

  return (
    <div
      ref={containerRef}
      onPointerEnter={() => setIsHovered(true)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`inline-block select-none cursor-default ${containerClassName}`}
      aria-label={label}
    >
      <div className={`flex flex-wrap items-center gap-x-2 ${className}`}>
        {words.map((word, wIdx) => (
          <span key={wIdx} className="inline-block whitespace-nowrap">
            {word.split('').map((char, cIdx) => {
              const currentIdx = letterIndex++;
              return (
                <span
                  key={cIdx}
                  ref={(el) => {
                    letterRefs.current[currentIdx] = el;
                  }}
                  className="inline-block transition-all duration-75"
                  style={{
                    fontVariationSettings: fromFontVariationSettings,
                  }}
                >
                  {char}
                </span>
              );
            })}
          </span>
        ))}
      </div>
    </div>
  );
};
