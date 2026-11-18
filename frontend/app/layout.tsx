import type { Metadata } from 'next';
import React from 'react';
import { Roboto, Roboto_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { AppShell } from '@/components/layout/AppShell';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

const robotoMono = Roboto_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export const metadata: Metadata = {
  title: 'Lunova | AI Proposal Intelligence Platform',
  description:
    'Calm, evidence-grounded AI proposal intelligence platform with strict multi-tenant boundaries and human oversight.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${roboto.variable} ${robotoMono.variable}`}>
      <body className="bg-bg text-text min-h-screen selection:bg-accent-soft selection:text-accent font-sans subpixel-antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
