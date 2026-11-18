'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Play, Pause, Sparkles, Activity } from 'lucide-react';
import { TypewriterText } from './TypewriterText';
import { MagneticButton } from '@/components/ui/MagneticButton';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4';

export const LandingHero: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    const startPlayback = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Autoplay pending user interaction:', err);
          });
      }
    };

    startPlayback();

    const onUserInteract = () => {
      startPlayback();
    };

    window.addEventListener('click', onUserInteract, { once: true, passive: true });
    window.addEventListener('scroll', onUserInteract, { once: true, passive: true });
    window.addEventListener('touchstart', onUserInteract, { once: true, passive: true });

    return () => {
      window.removeEventListener('click', onUserInteract);
      window.removeEventListener('scroll', onUserInteract);
      window.removeEventListener('touchstart', onUserInteract);
    };
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section className="relative pt-28 pb-14 sm:pt-32 sm:pb-16 md:pt-36 md:pb-20 bg-gradient-to-b from-blue-50/90 via-sky-50/40 to-slate-50/30 border-b border-blue-100 overflow-hidden">
      {/* Crisp non-blurry geometric background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.04)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Crisp light blue subtle geometric corner accents (no blur) */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/50 via-sky-50/30 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-100/40 via-slate-50/30 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Asymmetric Editorial Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column (7 Cols): Refined, Professional Typography & Action */}
          <div className="lg:col-span-7 space-y-6 z-10">
            {/* Eyebrow Label with alive pulse */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/95 border border-blue-200 text-xs font-bold text-blue-800 tracking-wide shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
              </span>
              <span>PROPOSAL RESPONSE INTELLIGENCE</span>
            </div>

            {/* Restrained Enterprise Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-[42px] lg:text-[46px] font-extrabold tracking-tight text-slate-950 leading-[1.15]">
              Your company&apos;s knowledge.{' '}
              <span className="text-blue-600 block sm:inline">
                Ready for the next proposal.
              </span>
            </h1>

            {/* Typewriter Accent */}
            <div className="text-slate-800 font-medium">
              <TypewriterText />
            </div>

            {/* Professional Supporting Copy */}
            <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal max-w-xl">
              Lunova turns incoming proposal requests into evidence-backed drafts, bringing company knowledge, requirements, and human review into one controlled workflow.
            </p>

            {/* Magnetic Action Buttons - Larger & Generously Padded to easily hold text */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <MagneticButton strength={0.2}>
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center justify-center gap-3 min-h-[54px] px-8 sm:px-10 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base font-bold shadow-md shadow-blue-500/25 hover:shadow-lg transition-all duration-200 cursor-pointer whitespace-nowrap"
                >
                  <span>Explore Lunova</span>
                  <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>
              </MagneticButton>

              <MagneticButton strength={0.15}>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2.5 min-h-[54px] px-8 sm:px-10 py-3.5 rounded-xl bg-white hover:bg-blue-50/80 text-slate-800 hover:text-blue-700 border-2 border-slate-200 hover:border-blue-300 text-base font-bold shadow-sm transition-all duration-200 cursor-pointer whitespace-nowrap"
                >
                  <span>See how it works</span>
                </a>
              </MagneticButton>
            </div>

            {/* Trust Micro-Assurance */}
            <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
              <ShieldCheck className="w-4.5 h-4.5 text-blue-600 shrink-0" />
              <span>Human review stays in control — Zero ungrounded claims fabricated.</span>
            </div>
          </div>

          {/* Right Column (5 Cols): Cinematic Atmospheric Video Panel with Alive Movement */}
          <div className="lg:col-span-5 relative">
            {/* Hanging Status Badge with subtle pendulum swing */}
            <div className="hidden sm:flex absolute -top-8 right-8 z-30 flex-col items-center animate-hang origin-top pointer-events-none">
              <div className="w-[1.5px] h-6 bg-gradient-to-b from-blue-300 to-blue-500" />
              <div className="px-3.5 py-1 rounded-full bg-white border border-blue-200 text-[10px] font-mono font-bold text-blue-700 shadow-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>ACTIVE GROUNDING • LIVE</span>
              </div>
            </div>

            {/* Alive Floating Micro-card */}
            <div className="hidden sm:flex absolute -bottom-6 -left-6 z-30 p-3.5 rounded-2xl bg-white border border-blue-100 shadow-xl items-center gap-3 animate-float transition-transform hover:scale-105">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
                <Sparkles className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Verification Engine</div>
                <div className="text-xs font-bold text-slate-900">Zero Fabrications Guaranteed</div>
              </div>
            </div>

            {/* Video Container Card - Autoplay Always Running */}
            <div className="group relative rounded-2xl border-2 border-slate-200 hover:border-blue-400 bg-slate-900 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/5]">
              <video
                ref={videoRef}
                src={VIDEO_URL}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onCanPlay={() => {
                  if (videoRef.current && videoRef.current.paused) {
                    videoRef.current.play().catch(() => {});
                  }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-cover opacity-90 transition-opacity"
                aria-label="Cinematic background atmosphere"
              />

              {/* Atmospheric Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-slate-950/20 pointer-events-none" />

              {/* Video Overlay Info & Control */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white z-20">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-blue-200 block font-semibold">
                      Cinematic Atmosphere
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white">
                    Intelligence in Motion
                  </span>
                </div>

                <button
                  onClick={togglePlay}
                  className="p-2.5 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white border border-white/20 transition-all hover:scale-110 active:scale-95 shadow-md cursor-pointer"
                  title={isPlaying ? 'Pause atmosphere' : 'Play atmosphere'}
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Video Label */}
            <div className="mt-2.5 text-[11px] font-mono text-slate-500 font-medium flex items-center justify-between px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Lunova Atmospheric Engine
              </span>
              <span>Proprietary Visual Identity</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
