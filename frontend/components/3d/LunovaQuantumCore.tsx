'use client';

import React from 'react';
import { Activity } from 'lucide-react';

interface QuantumCoreProps {
  isProcessing?: boolean;
  activeStage?: string;
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string | null) => void;
}

export default function LunovaQuantumCore({
  isProcessing = false,
  activeStage = 'idle',
  selectedNodeId,
  onSelectNode,
}: QuantumCoreProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400">
      <div className="text-center">
        <Activity className={`w-12 h-12 mx-auto mb-4 ${isProcessing ? 'animate-pulse text-indigo-400' : ''}`} />
        <p className="font-mono text-sm">Lunova Quantum Core</p>
        <p className="text-xs mt-2 opacity-50">Stage: {activeStage}</p>
      </div>
    </div>
  );
}
