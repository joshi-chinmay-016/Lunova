'use client';

import React, { useRef, useEffect } from 'react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingHero } from '@/components/landing/LandingHero';
import { ProblemTransformation } from '@/components/landing/ProblemTransformation';
import { SignatureMotionSequence } from '@/components/landing/SignatureMotionSequence';
import { EvidenceGroundedSection } from '@/components/landing/EvidenceGroundedSection';
import { WorkflowOverview } from '@/components/landing/WorkflowOverview';
import { HumanControlSection } from '@/components/landing/HumanControlSection';
import { ProductPreviewSection } from '@/components/landing/ProductPreviewSection';
import { CapabilitiesSection } from '@/components/landing/CapabilitiesSection';
import { FinalCTASection } from '@/components/landing/FinalCTASection';
import { LandingFooter } from '@/components/landing/LandingFooter';

const BACKGROUND_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261029_084140_0b1278a9-189f-4d9e-9a36-00f6a21e4788.mp4';

export default function LandingPage() {
  const bgVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = bgVideoRef.current;
    if (!video) return;

    video.muted = true;
    const startPlayback = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback if browser requires interaction
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

  return (
    <div className="relative min-h-screen text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Background Video Layer — Pure Background Only, Zero Interaction/Click Interference */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <video
          ref={bgVideoRef}
          src={BACKGROUND_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-center scale-[1.02]"
        />
        {/* Soft atmospheric overlay scrim — preserves the landscape colors while ensuring high text contrast */}
        <div className="absolute inset-0 bg-white/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/80" />
      </div>

      {/* Main Content Layer — All components untouched, positioned cleanly above background */}
      <div className="relative z-10">
        {/* Section A: Navigation */}
        <LandingNavbar />

        {/* Section B: Hero Section — Cinematic and Memorable */}
        <LandingHero />

        {/* Section C: The Problem and Transformation */}
        <ProblemTransformation />

        {/* Section D: Signature Animation — Email to Lunova to Response */}
        <SignatureMotionSequence />

        {/* Section E: Evidence-Based Responses */}
        <EvidenceGroundedSection />

        {/* Section F: Workflow Overview */}
        <WorkflowOverview />

        {/* Section G: Human Control */}
        <HumanControlSection />

        {/* Section H: Product Interface Preview */}
        <ProductPreviewSection />

        {/* Section I: Capabilities */}
        <CapabilitiesSection />

        {/* Section J: Final CTA */}
        <FinalCTASection />

        {/* Section K: Footer */}
        <LandingFooter />
      </div>
    </div>
  );
}
