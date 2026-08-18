import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from '@/lib/prompts';

// Converted from the original api/api.js.
// Runs server-side so the upstream worker URL never has to be called
// directly from the browser.

const WORKER_URL = 'https://anya-apis.vercel.app/ai';

interface UpstreamMessage {
  role: string;
  content: string;
}

export async function POST(req: NextRequest) {
  let history: UpstreamMessage[];
  try {
    const body = await req.json();
    history = Array.isArray(body?.history) ? body.history : [];
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const messages: UpstreamMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...history];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000);

  try {
    const r = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });

    if (!r.ok) {
      return NextResponse.json({ error: `HTTP ${r.status}` }, { status: 502 });
    }

    const d = await r.json();
    const text: string = d.response || d.content || d.text || d.message || '';

    if (!text) {
      return NextResponse.json({ error: 'empty response' }, { status: 502 });
    }

    return NextResponse.json({ text });
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') {
      return NextResponse.json({ error: 'timeout' }, { status: 504 });
    }
    const message = e instanceof Error ? e.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    clearTimeout(timer);
  }
}
