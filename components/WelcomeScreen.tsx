'use client';

import { useSug } from '@/app/app';

const SUGGESTIONS = [
  'Buat REST API dengan Node.js + JWT auth',
  'Jelaskan Big O dan kompleksitas algoritma',
  'Cara implement WebSocket real-time chat',
  'Docker + Kubernetes deployment guide',
  'React hooks terbaik untuk state management',
  'SQL query optimization dan indexing',
];

export default function WelcomeScreen() {
  return (
    <div id="welcome">
      <div className="w-logo" style={{ overflow: 'hidden', padding: 0, borderRadius: 20 }}>
        <img
          src="/icon.png"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', borderRadius: 8 }}
          alt="Kiyora"
        />
      </div>
      <h1
        id="hero-h1"
        dangerouslySetInnerHTML={{
          __html:
            'Halo! Aku <span style="background:linear-gradient(120deg,#3D84F7,#60A5FA,#93BFFF,#3D84F7);background-size:300%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmerBlue 4s linear infinite">Kiyora</span>',
        }}
      />
      <p
        id="hero-sub"
        style={{ fontSize: 13, color: 'var(--t2)', letterSpacing: '.01em', transition: 'opacity .4s ease', minHeight: 20 }}
      >
        AI asisten gen Z kamu · by Hanz
      </p>
      <div className="feat-row">
        <div className="feat">
          <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          Expert Coding
        </div>
        <div className="feat">
          <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Deep Analysis
        </div>
        <div className="feat">
          <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          System Design
        </div>
      </div>
      <div className="sug-grid">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="sug" onClick={() => useSug(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
