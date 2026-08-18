/**
 * Client-side API helpers.
 * `callAI` now calls our own Next.js route handler (app/api/chat/route.ts)
 * instead of hitting the upstream AI worker directly from the browser.
 */

import type { ChatMsg } from './types';

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const IMAGE_URL = 'https://anya-apis.vercel.app/Imagine';

export async function callAI(history: ChatMsg[], externalSignal?: AbortSignal): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000);
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort);
  }

  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history: history.map((m) => ({ role: m.r === 'u' ? 'user' : 'assistant', content: m.c })),
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
    const text = data?.text;
    if (!text) throw new Error('empty response');
    return text as string;
  } catch (e: unknown) {
    if (externalSignal?.aborted) {
      const abortErr = new Error('aborted');
      abortErr.name = 'AbortError';
      throw abortErr;
    }
    if (e instanceof Error && e.name === 'AbortError') throw new Error('timeout');
    throw e;
  } finally {
    clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
  }
}

export interface WeatherResult {
  city: string;
  country: string;
  temp: number;
  wind: number;
  code: number;
}

export async function fetchWeather(city: string): Promise<WeatherResult | null> {
  const geo = await fetch(`${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
  const gd = await geo.json();
  const results = gd.results || [];
  if (!results.length) return null;
  const { latitude: lat, longitude: lon, name, country } = results[0];
  const w = await fetch(
    `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m&timezone=auto&forecast_days=1`
  );
  const wd = await w.json();
  const cw = wd.current_weather;
  return { city: name, country, temp: Math.round(cw.temperature), wind: Math.round(cw.windspeed), code: cw.weathercode };
}

export async function generateImage(prompt: string): Promise<string> {
  const encoded = encodeURIComponent(prompt);
  const resp = await fetch(`${IMAGE_URL}?prompt=${encoded}`);
  if (!resp.ok) throw new Error('status ' + resp.status);
  const blob = await resp.blob();
  if (blob.size < 500) throw new Error('response too small');
  return URL.createObjectURL(blob);
}

export function getWeatherDesc(code: number): string {
  if (code <= 0) return 'Clear sky';
  if (code <= 2) return 'Mostly clear';
  if (code <= 3) return 'Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 67) return 'Rainy';
  if (code <= 86) return 'Snowy';
  return 'Thunderstorm';
}
