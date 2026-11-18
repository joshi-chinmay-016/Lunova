'use client';

import { useSyncExternalStore } from 'react';
import {
  MoonPhase,
  ProposalContext,
  DocumentItem,
  Requirement,
  ThemeSettings,
  UserProfile,
} from '@/types/lunova';
import { initialProposals, initialDocuments } from './mockData';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  phase?: MoonPhase;
  type?: 'default' | 'success' | 'warning' | 'error';
  undoAction?: () => void;
}

export interface LunovaStoreState {
  settings: ThemeSettings;
  setTheme: (theme: 'night' | 'day') => void;
  toggleTheme: () => void;
  setReducedMotion: (val: boolean) => void;
  setDisable3D: (val: boolean) => void;

  user: UserProfile;
  setUser: (user: UserProfile) => void;

  proposals: ProposalContext[];
  activeProposalId: string | null;
  setActiveProposalId: (id: string | null) => void;
  updateProposalPhase: (id: string, phase: MoonPhase) => void;
  updateRequirementDraft: (proposalId: string, reqId: string, answer: string) => void;
  verifyRequirement: (proposalId: string, reqId: string) => void;
  flagMissingInfo: (proposalId: string, reqId: string, note?: string) => void;

  documents: DocumentItem[];
  addDocument: (doc: DocumentItem) => void;
  updateDocumentStatus: (id: string, status: DocumentItem['status']) => void;

  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;

  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;

  resetSampleData: () => void;
}

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

let currentState: LunovaStoreState = {
  settings: {
    theme: 'night',
    reducedMotion: false,
    disable3D: false,
    soundEnabled: false,
  },
  setTheme: (theme: 'night' | 'day') => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    currentState = {
      ...currentState,
      settings: { ...currentState.settings, theme },
    };
    notify();
  },
  toggleTheme: () => {
    const next = currentState.settings.theme === 'night' ? 'day' : 'night';
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', next);
    }
    currentState = {
      ...currentState,
      settings: { ...currentState.settings, theme: next },
    };
    notify();
  },
  setReducedMotion: (reducedMotion: boolean) => {
    currentState = {
      ...currentState,
      settings: { ...currentState.settings, reducedMotion },
    };
    notify();
  },
  setDisable3D: (disable3D: boolean) => {
    currentState = {
      ...currentState,
      settings: { ...currentState.settings, disable3D },
    };
    notify();
  },

  user: {
    id: 'usr-1',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@lunetron.com',
    role: 'Lead Architect',
    tenant: 'Lunetron Technologies',
    avatarInitials: 'SJ',
  },
  setUser: (user: UserProfile) => {
    currentState = { ...currentState, user };
    notify();
  },

  proposals: initialProposals,
  activeProposalId: 'prop-101',
  setActiveProposalId: (id: string | null) => {
    currentState = { ...currentState, activeProposalId: id };
    notify();
  },

  updateProposalPhase: (id: string, phase: MoonPhase) => {
    const prevProposal = currentState.proposals.find((p) => p.id === id);
    const prevPhase = prevProposal?.phase;

    currentState = {
      ...currentState,
      proposals: currentState.proposals.map((p) =>
        p.id === id ? { ...p, phase } : p
      ),
    };
    notify();

    currentState.addToast({
      title: `Status: ${phase.replace('_', ' ').toUpperCase()}`,
      message: `${prevProposal?.title || 'Proposal'} moved to ${phase}.`,
      phase,
      undoAction: prevPhase
        ? () => {
            currentState = {
              ...currentState,
              proposals: currentState.proposals.map((p) =>
                p.id === id ? { ...p, phase: prevPhase } : p
              ),
            };
            notify();
          }
        : undefined,
    });
  },

  updateRequirementDraft: (proposalId: string, reqId: string, answer: string) => {
    currentState = {
      ...currentState,
      proposals: currentState.proposals.map((p) => {
        if (p.id !== proposalId) return p;
        return {
          ...p,
          requirements: p.requirements.map((r) =>
            r.id === reqId ? { ...r, draftAnswer: answer, status: 'drafted' as const } : r
          ),
        };
      }),
    };
    notify();
  },

  verifyRequirement: (proposalId: string, reqId: string) => {
    currentState = {
      ...currentState,
      proposals: currentState.proposals.map((p) => {
        if (p.id !== proposalId) return p;
        const updatedReqs = p.requirements.map((r) =>
          r.id === reqId ? { ...r, status: 'verified' as const } : r
        );
        const allVerified = updatedReqs.every((r) => r.status === 'verified');
        return {
          ...p,
          phase: allVerified ? 'approved' : p.phase,
          requirements: updatedReqs,
        };
      }),
    };
    notify();
  },

  flagMissingInfo: (proposalId: string, reqId: string, note?: string) => {
    currentState = {
      ...currentState,
      proposals: currentState.proposals.map((p) => {
        if (p.id !== proposalId) return p;
        return {
          ...p,
          phase: 'blocked',
          missingCount: p.missingCount + 1,
          requirements: p.requirements.map((r) =>
            r.id === reqId
              ? {
                  ...r,
                  status: 'flagged' as const,
                  missingInfoNote: note || 'Explicit requirement without corporate evidence.',
                }
              : r
          ),
        };
      }),
    };
    notify();
  },

  documents: initialDocuments,
  addDocument: (doc: DocumentItem) => {
    currentState = {
      ...currentState,
      documents: [doc, ...currentState.documents],
    };
    notify();
  },
  updateDocumentStatus: (id: string, status: DocumentItem['status']) => {
    currentState = {
      ...currentState,
      documents: currentState.documents.map((d) =>
        d.id === id ? { ...d, status } : d
      ),
    };
    notify();
  },

  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open: boolean) => {
    currentState = { ...currentState, isCommandPaletteOpen: open };
    notify();
  },
  toggleCommandPalette: () => {
    currentState = {
      ...currentState,
      isCommandPaletteOpen: !currentState.isCommandPaletteOpen,
    };
    notify();
  },

  toasts: [],
  addToast: (toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    currentState = {
      ...currentState,
      toasts: [...currentState.toasts.slice(-4), { ...toast, id }],
    };
    notify();
    setTimeout(() => {
      currentState.removeToast(id);
    }, 4500);
  },
  removeToast: (id: string) => {
    currentState = {
      ...currentState,
      toasts: currentState.toasts.filter((t) => t.id !== id),
    };
    notify();
  },

  resetSampleData: () => {
    currentState = {
      ...currentState,
      proposals: initialProposals,
      documents: initialDocuments,
      activeProposalId: 'prop-101',
    };
    notify();
  },
};

const getSnapshot = () => currentState;
const getServerSnapshot = () => currentState;

export function useLunovaStore(): LunovaStoreState;
export function useLunovaStore<T>(selector: (state: LunovaStoreState) => T): T;
export function useLunovaStore<T>(selector?: (state: LunovaStoreState) => T): T | LunovaStoreState {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return selector ? selector(state) : state;
}

useLunovaStore.getState = () => currentState;
