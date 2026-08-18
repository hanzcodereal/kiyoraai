'use client';

import { newChat, toggleSb } from '@/app/app';

export default function Sidebar() {
  return (
    <>
      <div id="ov" onClick={toggleSb} />
      <nav id="sb">
        <div className="sb-head">
          <div className="logo" style={{ overflow: 'hidden', padding: 0 }}>
            <img
              src="/icon.png"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', borderRadius: 8 }}
              alt="Kiyora"
            />
          </div>
          <span className="logo-txt">
            Kiyora <span>AI</span>
          </span>
        </div>
        <button id="new-btn" onClick={newChat}>
          <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New chat
        </button>
        <div className="sb-section">Recent chats</div>
        <div id="hist" />
        <div className="sb-foot">
          <div className="online-dot" />
          <div className="sb-foot-info">
            Kiyora AI
            <br />
            Online
          </div>
        </div>
      </nav>
    </>
  );
}
