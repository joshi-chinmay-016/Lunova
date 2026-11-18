'use client';

import React from 'react';
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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
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
  );
}
