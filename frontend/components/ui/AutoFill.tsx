'use client';

import React, { useState, useEffect } from 'react';

interface AutoFillProps {
  value: string;
  delayMs?: number;
  className?: string;
  prefix?: string;
}

export const AutoFill: React.FC<AutoFillProps> = ({
  value,
  delayMs = 0,
  className = '',
  prefix = '',
}) => {
  const [currentText, setCurrentText] = useState('');
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let charIndex = 0;

    const startTimer = setTimeout(() => {
      const typeInterval = setInterval(() => {
        if (charIndex <= value.length) {
          setCurrentText(value.slice(0, charIndex));
          charIndex += 1;
        } else {
          clearInterval(typeInterval);
          setSettled(true);
        }
      }, 25);

      return () => clearInterval(typeInterval);
    }, delayMs);

    return () => {
      clearTimeout(startTimer);
    };
  }, [value, delayMs]);

  return (
    <span
      className={`inline-flex items-center transition-all duration-300 ${
        settled ? 'text-text' : 'text-evidence'
      } ${className}`}
    >
      {prefix}
      <span>{currentText || '...'}</span>
      {!settled && (
        <span className="w-1 h-3 ml-1 bg-evidence animate-pulse" />
      )}
    </span>
  );
};
