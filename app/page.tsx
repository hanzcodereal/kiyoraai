'use client';

import { useEffect } from 'react';

import LoadingScreen from '@/components/LoadingScreen';
import SplashScreen from '@/components/SplashScreen';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import WelcomeScreen from '@/components/WelcomeScreen';
import InputBar from '@/components/InputBar';

import { initKiyoraApp, closeZoom } from '@/app/app';
import { initSplash, initLoadingBar } from '@/app/splash';

export default function Page() {
  useEffect(() => {
    initSplash();
    initLoadingBar();
    initKiyoraApp();
  }, []);

  return (
    <>
      <LoadingScreen />
      <SplashScreen />
      <Sidebar />

      <div id="main">
        <TopBar />

        <div id="chat">
          <WelcomeScreen />
          <div id="msgs" />
        </div>

        <InputBar />
      </div>

      <div id="lightbox" onClick={(e) => e.currentTarget === e.target && closeZoom()}>
        <button className="lightbox-close" onClick={closeZoom} title="Tutup">
          <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <img id="lightbox-img" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="Preview gambar" />
      </div>
    </>
  );
}
