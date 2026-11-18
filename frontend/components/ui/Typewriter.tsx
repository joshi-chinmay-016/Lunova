'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number; // ms per char (average)
  onComplete?: () => void;
  className?: string;
  autoStart?: boolean;
  allowSkip?: boolean;
}

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  speed = 18,
  onComplete,
  className = '',
  autoStart = true,
  allowSkip = true,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isDone, setIsDone] = useState(false);
  const indexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!autoStart) return;

    setDisplayedText('');
    setIsDone(false);
    indexRef.current = 0;

    const typeNext = () => {
      if (indexRef.current >= text.length) {
        setIsDone(true);
        if (onComplete) onComplete();
        return;
      }

      const currentChar = text[indexRef.current];
      indexRef.current += 1;
      setDisplayedText(text.slice(0, indexRef.current));

      // Variable speed with pauses for punctuation
      let delay = speed + Math.random() * 8;
      if (['.', '!', '?'].includes(currentChar)) {
        delay += 180;
      } else if ([',', ';', ':', '—'].includes(currentChar)) {
        delay += 90;
      }

      timeoutRef.current = setTimeout(typeNext, delay);
    };

    timeoutRef.current = setTimeout(typeNext, 40);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text, speed, autoStart, onComplete]);

  const handleSkip = () => {
    if (!allowSkip || isDone) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDisplayedText(text);
    setIsDone(true);
    if (onComplete) onComplete();
  };

  return (
    <span
      onClick={handleSkip}
      title={allowSkip && !isDone ? 'Click to show full draft' : undefined}
      className={`relative inline ${allowSkip && !isDone ? 'cursor-pointer' : ''} ${className}`}
    >
      {displayedText}
      {!isDone && (
        <span className="inline-block w-1.5 h-4 ml-0.5 bg-accent align-middle animate-pulse" />
      )}
    </span>
  );
};
