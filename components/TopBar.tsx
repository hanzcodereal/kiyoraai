'use client';

import { exportChat, newChat, toggleSb, toggleTheme } from '@/app/app';

export default function TopBar() {
  return (
    <header id="top">
      <div className="top-l">
        <button className="ibtn" onClick={toggleSb}>
          <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="model-tag">
          <div className="model-dot" />
          <strong>Kiyora</strong>
          <span style={{ color: 'var(--t3)' }}>·</span>
          <span>LF 2.5</span>
        </div>
      </div>
      <div className="top-r">
        <button className="ibtn" title="Toggle theme" onClick={toggleTheme}>
          <svg id="theme-icon" viewBox="0 0 24 24" fill="none" strokeLinecap="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
        <button className="ibtn" title="Export chat" onClick={exportChat}>
          <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
        <button className="ibtn" title="New chat" onClick={newChat}>
          <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
