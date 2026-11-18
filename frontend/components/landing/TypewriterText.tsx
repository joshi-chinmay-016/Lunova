'use client';

import React, { useState, useEffect } from 'react';

const PHRASES = [
  'review-ready responses',
  'evidence-backed drafts',
  'structured proposal answers',
];

export const TypewriterText: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState(PHRASES[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(PHRASES[0].length);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayText(PHRASES[0]);
      return;
    }

    const currentPhrase = PHRASES[phraseIndex];

    const typingSpeed = isDeleting ? 25 : 50;
    const pauseDelay = isDeleting ? 300 : 2500;

    let timeout: NodeJS.Timeout;

    if (!isDeleting && charIndex === currentPhrase.length) {
      timeout = setTimeout(() => setIsDeleting(true), pauseDelay);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
    } else {
      timeout = setTimeout(() => {
        const nextCharIndex = isDeleting ? charIndex - 1 : charIndex + 1;
        setCharIndex(nextCharIndex);
        setDisplayText(currentPhrase.substring(0, nextCharIndex));
      }, typingSpeed);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex, reducedMotion]);

  return (
    <div
      className={`inline-flex flex-wrap items-baseline gap-x-2 text-sm sm:text-base font-medium text-slate-600 ${className}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <span>From incoming requests to</span>
      <span className="relative inline-block font-semibold text-blue-600 min-w-[210px] sm:min-w-[240px] text-left">
        <span className="border-b border-blue-500/30 pb-0.5">
          {displayText}
        </span>
        <span
          className="inline-block w-[1.5px] h-[1em] bg-blue-600 ml-0.5 align-middle animate-pulse"
          aria-hidden="true"
        />
      </span>
    </div>
  );
};
