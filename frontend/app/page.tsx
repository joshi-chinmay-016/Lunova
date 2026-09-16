import React from 'react';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Lunova</h1>
      <p style={{ color: '#555', fontSize: '1.1rem' }}>
        AI-Powered Proposal Response Agent (Lunetron MVP)
      </p>
      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <h3>Repository Foundation Active</h3>
        <p>
          Architecture contracts, team ownership, and development stubs are established for parallel feature development.
        </p>
      </div>
    </main>
  );
}
