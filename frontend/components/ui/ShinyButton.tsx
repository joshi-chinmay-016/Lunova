'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'glass';
  icon?: React.ReactNode;
  href?: string;
}

export const ShinyButton: React.FC<ShinyButtonProps> = ({
  children,
  className = '',
  onClick,
  variant = 'primary',
  icon,
  href,
  ...props
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    setPosition({
      x: Math.round((clientX - centerX) * 0.15),
      y: Math.round((clientY - centerY) * 0.15),
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const buttonContent = (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 280, damping: 20, mass: 0.1 }}
      onClick={onClick}
      className={
        variant === 'primary'
          ? `relative inline-flex items-center justify-center gap-2.5 min-h-[52px] sm:min-h-[56px] px-8 sm:px-10 py-3.5 rounded-2xl font-display font-bold text-sm sm:text-base text-white overflow-hidden shadow-[0_8px_25px_rgba(5,150,105,0.25)] hover:shadow-[0_12px_35px_rgba(5,150,105,0.4)] transition-all duration-300 group cursor-pointer border border-emerald-400/30 active:scale-[0.98] ${className}`
          : `relative inline-flex items-center justify-center gap-2.5 min-h-[52px] sm:min-h-[56px] px-8 sm:px-10 py-3.5 rounded-2xl font-display font-bold text-sm sm:text-base text-slate-900 bg-white/95 hover:bg-white border-2 border-slate-200/90 hover:border-emerald-400/80 shadow-[0_4px_16px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_24px_rgba(5,150,105,0.15)] transition-all duration-300 group cursor-pointer backdrop-blur-md active:scale-[0.98] ${className}`
      }
      {...(props as any)}
    >
      {variant === 'primary' && (
        <>
          {/* Quantum Gradient Canvas */}
          <span className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 transition-transform duration-500 group-hover:scale-105" />

          {/* Specular Light Reflection Sweep (ReactBits / Unicorn style) */}
          <span className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent group-hover:animate-shine pointer-events-none" />

          {/* Top Hairline Light Reflection */}
          <span className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />
        </>
      )}

      {/* Button Content */}
      <span className="relative z-10 flex items-center gap-2.5 tracking-tight">
        <span>{children}</span>
        {icon && (
          <span className={`transition-transform duration-200 group-hover:translate-x-1 ${variant === 'primary' ? 'text-white' : 'text-emerald-600'}`}>
            {icon}
          </span>
        )}
      </span>
    </motion.button>
  );

  if (href) {
    return <Link href={href} className="inline-block">{buttonContent}</Link>;
  }

  return buttonContent;
};
