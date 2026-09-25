import type { Metadata } from 'next';
import React from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lunova | 3D AI-Powered Proposal Response Nexus',
  description: 'Autonomous 3D Neural Proposal Agent & Verification Studio for RFPs',
};

import Providers from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070a13] text-slate-100 min-h-screen selection:bg-indigo-500 selection:text-white">

        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
