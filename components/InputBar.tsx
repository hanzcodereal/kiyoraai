'use client';

import { doClear, doSend, doStop, onInp, onKey } from '@/app/app';

export default function InputBar() {
  return (
    <div id="inp-wrap">
      <div id="inp-box">
        <textarea
          id="inp"
          placeholder="Nanya apa nih ke Kiyora…"
          rows={1}
          onInput={(e) => onInp(e.currentTarget)}
          onKeyDown={onKey}
        />
        <div className="inp-bar">
          <div className="inp-l">
            <button className="tb" title="Clear" onClick={doClear}>
              <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
          <div className="inp-r">
            <button id="stop-btn" onClick={doStop}>
              <svg viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
            </button>
            <button id="send-btn" onClick={doSend}>
              <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className="inp-hint">Kiyora bisa salah — verif info penting ya.</div>
    </div>
  );
}
