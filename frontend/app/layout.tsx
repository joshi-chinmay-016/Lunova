import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Lunova | AI-Powered Proposal Response Agent',
  description: 'Automated proposal analysis and response generation system initially for Lunetron',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
