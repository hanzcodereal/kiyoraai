'use client';

import { useEffect } from 'react';

import LoadingScreen from '@/components/LoadingScreen';
import SplashScreen from '@/components/SplashScreen';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import WelcomeScreen from '@/components/WelcomeScreen';
import InputBar from '@/components/InputBar';

import { initKiyoraApp } from '@/app/app';
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
    </>
  );
}
