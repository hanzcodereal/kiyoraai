'use client';

import { enterApp } from '@/app/splash';

export default function SplashScreen() {
  return (
    <div id="splash">
      <div className="sp-video-wrap" />
      <div className="sp-content">
        <div className="sp-top">
          <div className="sp-brand">
            <div className="sp-brand-av">
              <img src="/icon.png" alt="Kiyora" />
            </div>
            <span className="sp-brand-name">Kiyora AI</span>
            <span className="sp-brand-badge">Lite Fast 2.5</span>
          </div>
          <div className="sp-greeting-row">
            <div className="dot" />
            <span id="sp-day-greeting" />
            <div className="dot" />
            <span id="sp-date-str" />
            <div className="dot" />
            <div className="batt-icon">
              <div className="batt-body" id="batt-body">
                <div className="batt-fill" id="batt-fill" style={{ width: '0%' }} />
              </div>
              <div className="batt-tip" />
            </div>
            <span id="batt-pct">--%</span>
          </div>
          <div className="sp-hero">
            <h1>
              Hai, Aku <span>Kiyora</span>
            </h1>
            <p>
              AI asisten gen Z kamu — chat santai,
              <br />
              coding, atau nanya apa aja bisa.
            </p>
          </div>
        </div>

        <div className="sp-bottom">
          <button id="enter-btn" onClick={enterApp}>
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Mulai Chat
          </button>
          <span className="sp-enter-hint">Kiyora AI · by Hanz</span>
          <div className="sp-scroll-hint">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
