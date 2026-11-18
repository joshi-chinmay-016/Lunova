'use client';

import React from 'react';

interface SparklineMiniProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

export const SparklineMini: React.FC<SparklineMiniProps> = ({
  data,
  color = 'var(--accent)',
  width = 64,
  height = 24,
  className = '',
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className={`inline-flex items-center ${className}`}>
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="transition-all duration-500 ease-out"
        />
        {/* End dot */}
        {data.length > 0 && (
          <circle
            cx={width}
            cy={height - ((data[data.length - 1] - min) / range) * (height - 6) - 3}
            r="2"
            fill={color}
          />
        )}
      </svg>
    </div>
  );
};
