'use client';

import { useSug } from '@/app/app';

const SUGGESTIONS = [
  'Gambarkan kucing astronot lagi santai di bulan',
  'Buat REST API dengan Node.js + JWT auth',
  'Tips ngatur waktu belajar biar ga burnout',
  'Rekomendasi ide caption buat foto liburan',
  'Cara implement WebSocket real-time chat',
  'Jelasin cara kerja bunga bank ke aku',
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
          __html: 'Halo! Aku <span style="color:var(--acc)">Kiyora</span>',
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
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          Bikin Gambar
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
