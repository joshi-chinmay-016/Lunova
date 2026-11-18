'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { useLunovaStore } from '@/lib/lunovaStore';

interface CoverageMoonWidgetProps {
  coveragePercent: number; // e.g. 88
}

export const CoverageMoonWidget: React.FC<CoverageMoonWidgetProps> = ({
  coveragePercent = 88,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGapDrawerOpen, setIsGapDrawerOpen] = useState(false);
  const { settings } = useLunovaStore();

  useEffect(() => {
    if (!containerRef.current || settings.disable3D) return;

    const width = 120;
    const height = 120;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 2.4;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    containerRef.current.appendChild(renderer.domElement);

    // Procedural Moon Sphere
    const geometry = new THREE.SphereGeometry(0.85, 32, 32);

    // Shader or directional lighting positioned by coverage percentage
    const lightAngle = (coveragePercent / 100) * Math.PI;
    const dirLight = new THREE.DirectionalLight(0xe8c26a, 2.2);
    dirLight.position.set(Math.cos(lightAngle) * 2, 0.5, Math.sin(lightAngle) * 2);
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0x1b2330, 0.6);
    scene.add(ambientLight);

    const material = new THREE.MeshStandardMaterial({
      color: 0xece8df,
      roughness: 0.85,
      metalness: 0.1,
    });

    const moonMesh = new THREE.Mesh(geometry, material);
    scene.add(moonMesh);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      moonMesh.rotation.y += 0.003;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [coveragePercent, settings.disable3D]);

  return (
    <>
      <div
        onClick={() => setIsGapDrawerOpen(true)}
        className="lunar-card-interactive p-4.5 flex items-center justify-between gap-4 cursor-pointer group"
        title="Click to view Knowledge Gap Analysis"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-evidence" />
            <span className="eyebrow">Coverage Moon</span>
          </div>
          <h4 className="text-base font-bold text-text group-hover:text-accent transition-colors">
            {coveragePercent}% Knowledge Indexed
          </h4>
          <p className="text-xs text-text-muted leading-tight">
            Click to inspect thin coverage &amp; flagged gaps.
          </p>
        </div>

        {/* 3D or 2D Fallback Moon Sphere */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          {!settings.disable3D ? (
            <div ref={containerRef} className="w-full h-full flex items-center justify-center" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-surface-2 border border-accent/40 flex items-center justify-center shadow-accent-glow">
              <span className="text-sm font-mono font-bold text-accent">{coveragePercent}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Gap Analysis Drawer Modal */}
      {isGapDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsGapDrawerOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-card bg-surface-1 border border-line shadow-2xl p-6 z-10 space-y-5">
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <span className="eyebrow text-gap">Gap Analysis Report</span>
                <h3 className="text-lg font-bold text-text mt-0.5">
                  Knowledge Base Boundary
                </h3>
              </div>
              <button
                onClick={() => setIsGapDrawerOpen(false)}
                className="p-1 rounded text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-text-muted">
              <p>
                Lunova matches incoming RFP criteria against your indexed corporate documents. When evidence is insufficient, answers are flagged rather than hallucinated:
              </p>

              {/* Identified Gaps */}
              <div className="space-y-2 pt-1">
                <div className="p-3 rounded bg-surface-2 border border-gap/30 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-gap shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-text">Onboarding Velocity for &gt;5,000 Seats</p>
                    <p className="text-[11px] text-text-muted">
                      Flagged in Northwind Logistics RFP. Requires certified Solutions Engineering playbook.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded bg-surface-2 border border-gap/30 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-gap shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-text">PCI-DSS Level 1 Audit Attestation</p>
                    <p className="text-[11px] text-text-muted">
                      Required for Starlight Retail questionnaire. Document expired 30 days ago.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5 border-t border-line">
              <button
                onClick={() => setIsGapDrawerOpen(false)}
                className="px-4 py-2 rounded-md bg-surface-2 hover:bg-surface-3 text-xs font-semibold text-text transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsGapDrawerOpen(false);
                  window.location.href = '/knowledge-base';
                }}
                className="px-4 py-2 rounded-md bg-accent text-bg text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <span>Upload Missing Docs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
