import type { Metadata } from 'next';
import React from 'react';
import { Roboto } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { AppShell } from '@/components/layout/AppShell';

const roboto = Roboto({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

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
    <html lang="en" className={roboto.variable}>
      <body className={`${roboto.className} bg-paper text-ink min-h-screen selection:bg-accent-soft selection:text-accent font-sans antialiased`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
