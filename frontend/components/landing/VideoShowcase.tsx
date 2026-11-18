'use client';

import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Inbox,
  Database,
  FileCheck2,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4';

const PROGRESSION_STEPS = [
  { step: '01', title: 'Intake', icon: Inbox, desc: 'Email & RFP extraction' },
  { step: '02', title: 'Evidence', icon: Database, desc: 'Tenant-safe vector RAG' },
  { step: '03', title: 'Drafting', icon: FileCheck2, desc: 'Grounded generation' },
  { step: '04', title: 'Review', icon: UserCheck, desc: 'Human approval station' },
];

export const VideoShowcase: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      setHasStarted(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <section
      id="video-story"
      className="py-20 md:py-28 bg-[#111521] text-white border-b border-[#2A334E] relative overflow-hidden"
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-brand/10 blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181E2E] border border-[#2A334E] text-[11px] font-semibold text-brand-border uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span>Product Architecture Story</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            From incoming request to review-ready response.
          </h2>

          <p className="text-sm sm:text-base text-slate-muted leading-relaxed max-w-2xl mx-auto">
            Watch how Lunova reads inbound client requests, retrieves substantiated internal company
            knowledge, and prepares a cited draft ready for executive review.
          </p>

          {/* Pipeline Step Progression Indicator */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {PROGRESSION_STEPS.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="bg-[#181E2E]/80 border border-[#2A334E] rounded-xl p-3 text-left flex items-center gap-2.5"
                >
                  <div className="w-7 h-7 rounded-lg bg-brand/20 text-brand border border-brand/30 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono text-slate-muted uppercase tracking-wider">
                      Step {s.step}
                    </div>
                    <div className="text-xs font-bold text-white truncate">{s.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Framed Cinematic Player Container */}
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl border border-[#2A334E] bg-[#181E2E] shadow-2xl overflow-hidden group">
            {/* Player Frame Header Bar */}
            <div className="px-4 py-2.5 bg-[#141824] border-b border-[#2A334E] flex items-center justify-between text-xs text-slate-muted">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 inline-block" />
                <span className="ml-2 font-mono text-[11px] text-slate-muted">
                  lunova-pipeline-overview.mp4
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Product Asset</span>
              </div>
            </div>

            {/* Video Element */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              {!videoError ? (
                <video
                  ref={videoRef}
                  src={VIDEO_URL}
                  preload="metadata"
                  playsInline
                  muted={isMuted}
                  loop
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={() => setVideoError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <p className="text-sm text-slate-muted">Video demonstration ready to stream</p>
                  <a
                    href={VIDEO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-xs text-brand underline font-semibold"
                  >
                    Open direct video stream &rarr;
                  </a>
                </div>
              )}

              {/* Big Initial Play Button Overlay */}
              {!hasStarted && !videoError && (
                <div
                  onClick={togglePlay}
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer group-hover:bg-black/30 transition-all"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand text-white flex items-center justify-center shadow-2xl transform transition-transform group-hover:scale-110">
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 ml-1 fill-white" />
                  </div>
                  <span className="mt-4 text-xs font-semibold tracking-wider uppercase text-white/90">
                    Watch Lunova Workflow
                  </span>
                </div>
              )}

              {/* Custom In-Player Controls */}
              {hasStarted && !videoError && (
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white" />
                      )}
                    </button>

                    <button
                      onClick={toggleMute}
                      className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-white" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>

                  <div className="text-[11px] font-mono text-slate-light">
                    Lunova Intelligence Pipeline
                  </div>

                  <button
                    onClick={handleFullscreen}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                    aria-label="Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Video Caption & Metadata */}
            <div className="p-4 sm:p-5 bg-[#141824] border-t border-[#2A334E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-white block">
                  Autonomous proposal understanding with evidence attribution
                </span>
                <span className="text-[11px] text-slate-muted block">
                  Grounding every response paragraph in internal company knowledge without hallucination.
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={togglePlay}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  {isPlaying ? 'Pause film' : 'Play film'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
