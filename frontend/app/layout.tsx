import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import Providers from './providers';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Lunova | AI Proposal Intelligence Platform',
  description:
    'Enterprise AI proposal response & proposal intelligence platform with evidence grounding, requirement extraction, and human review.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F4F5F7] text-gray-900 min-h-screen selection:bg-blue-600 selection:text-white antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
