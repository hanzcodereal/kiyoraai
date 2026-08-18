import type { KeyboardEvent } from 'react';
import { callAI } from '@/lib/api-client';
import { parseMD, esc, escInline } from '@/lib/markdown';
import { isCodingQ, detectID, mkAnalyzePrompt, mkCodePrompt, mkGenPrompt } from '@/lib/prompts';
import type { ChatMsg, ConversationStore } from '@/lib/types';

const STORAGE_KEY = 'cv4';

let convs: ConversationStore = {};
let cid: string | null = null;
let busy = false;
let ctrl: AbortController | null = null;
let lastUserMsg = '';

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function scrollBot(): void {
  const c = $('chat');
  if (!c) return;
  setTimeout(() => {
    c.scrollTop = c.scrollHeight;
  }, 40);
}

function resize(el: HTMLTextAreaElement): void {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 220) + 'px';
}

export function initKiyoraApp(): void {
  try {
    convs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    convs = {};
  }

  const dark = localStorage.getItem('theme') === 'dark';
  if (dark) document.body.classList.add('dark');
  updateThemeIcon();

  const sbOpen = window.innerWidth > 680;
  if (!sbOpen) $('sb')?.classList.add('closed');

  renderHist();

  window.copyCode = copyCode;
  window.copyMsg = copyMsg;
  window.regenLast = regenLast;
  window.retryLast = retryLast;

  startHeroRotation();
}

export function toggleTheme(): void {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  updateThemeIcon();
}

function updateThemeIcon(): void {
  const dark = document.body.classList.contains('dark');
  const icon = $('theme-icon');
  if (!icon) return;
  icon.innerHTML = dark
    ? '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
    : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
}

export function toggleSb(): boolean {
  const sb = $('sb');
  const ov = $('ov');
  const nowClosed = sb ? !sb.classList.contains('closed') : false;
  sb?.classList.toggle('closed', nowClosed);
  ov?.classList.toggle('on', !nowClosed && window.innerWidth <= 680);
  return !nowClosed;
}

function renderHist(): void {
  const el = $('hist');
  if (!el) return;
  const ids = Object.keys(convs).sort((a, b) => Number(b) - Number(a));
  if (!ids.length) {
    el.innerHTML = '<div style="padding:8px 14px;font-size:12px;color:var(--t3)">No chats yet</div>';
    return;
  }
  el.innerHTML = ids
    .map((id) => {
      const first = convs[id].msgs.find((m) => m.r === 'u');
      const label = (first ? first.c : 'Chat').slice(0, 44);
      return `<div class="hi${id === cid ? ' on' : ''}" data-conv-id="${id}">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <span>${esc(label)}${label.length >= 44 ? '…' : ''}</span>
      <button class="hi-del" data-del-id="${id}" title="Delete">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>`;
    })
    .join('');

  el.querySelectorAll<HTMLElement>('[data-conv-id]').forEach((row) => {
    row.addEventListener('click', () => loadConv(row.dataset.convId as string));
  });
  el.querySelectorAll<HTMLElement>('[data-del-id]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      delConv(btn.dataset.delId as string);
    });
  });
}

function loadConv(id: string): void {
  cid = id;
  const welcome = $('welcome');
  const msgsEl = $('msgs');
  if (welcome) welcome.style.display = 'none';
  if (msgsEl) msgsEl.innerHTML = '';
  convs[id]?.msgs.forEach((m) => addMsg(m.r, m.c, false));
  renderHist();
  scrollBot();
}

function delConv(id: string): void {
  delete convs[id];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  if (cid === id) newChat();
  else renderHist();
}

export function newChat(): void {
  cid = null;
  busy = false;
  const msgsEl = $('msgs');
  const welcome = $('welcome');
  if (msgsEl) msgsEl.innerHTML = '';
  if (welcome) welcome.style.display = 'flex';
  const i = $('inp') as HTMLTextAreaElement | null;
  if (i) {
    i.value = '';
    resize(i);
  }
  renderHist();
}

export function onInp(el: HTMLTextAreaElement): void {
  resize(el);
}

export function onKey(e: KeyboardEvent<HTMLTextAreaElement>): void {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    void doSend();
  }
}

export function useSug(text: string): void {
  const i = $('inp') as HTMLTextAreaElement | null;
  if (!i) return;
  i.value = text;
  resize(i);
  i.focus();
}

export function doClear(): void {
  const i = $('inp') as HTMLTextAreaElement | null;
  if (!i) return;
  i.value = '';
  resize(i);
  i.focus();
}

export function doStop(): void {
  ctrl?.abort();
  setLoad(false);
}

function setLoad(on: boolean): void {
  busy = on;
  const sendBtn = $('send-btn') as HTMLButtonElement | null;
  const stopBtn = $('stop-btn');
  if (sendBtn) sendBtn.disabled = on;
  stopBtn?.classList.toggle('show', on);
}

async function callAPI(msgText: string, signal: AbortSignal): Promise<string> {
  try {
    const reply = await callAI([{ r: 'u', c: msgText }], signal);
    if (reply) return reply;
  } catch (e) {
    if (signal.aborted || (e instanceof Error && e.name === 'AbortError')) throw e;
  }
  throw new Error('koneksi ke server gagal. coba reload ya~~');
}

export async function doSend(): Promise<void> {
  if (busy) return;
  const inp = $('inp') as HTMLTextAreaElement | null;
  if (!inp) return;
  const txt = inp.value.trim();
  if (!txt) return;

  const welcome = $('welcome');
  if (welcome) welcome.style.display = 'none';
  lastUserMsg = txt;
  const msgs: ChatMsg[] = cid && convs[cid] ? [...convs[cid].msgs] : [];
  addMsg('u', txt, true);
  msgs.push({ r: 'u', c: txt });
  inp.value = '';
  resize(inp);
  inp.focus();
  setLoad(true);
  ctrl = new AbortController();

  try {
    let reply = '';
    let analysis = '';

    if (isCodingQ(txt)) {
      showTyping(detectID(txt) ? 'Lagi mikirin solusinya…' : 'Analyzing requirements carefully…');
      try {
        analysis = await callAPI(mkAnalyzePrompt(txt), ctrl.signal);
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') throw e;
      }

      updateTyping(detectID(txt) ? 'Nulis kodenya…' : 'Writing precise implementation…');
      reply = await callAPI(mkCodePrompt(txt, analysis, msgs), ctrl.signal);
    } else {
      showTyping(detectID(txt) ? 'Lagi mikir…' : 'Thinking…');
      reply = await callAPI(mkGenPrompt(txt, msgs), ctrl.signal);
    }

    removeTyping();
    addMsg('a', reply, true, analysis);
    msgs.push({ r: 'a', c: reply });
    saveConv(msgs);
  } catch (err) {
    removeTyping();
    if (err instanceof Error && err.name === 'AbortError') {
      setLoad(false);
      ctrl = null;
      return;
    }
    showErrMsg(err instanceof Error ? err.message : String(err));
  } finally {
    setLoad(false);
    ctrl = null;
  }
}

function showErrMsg(errText: string): void {
  const row = document.createElement('div');
  row.className = 'mrow a fi';
  row.innerHTML = `<div class="min"><div class="mc">
    ${aiHdr()}
    <div class="err-box"><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <div class="err-txt">Gagal terhubung ke API.<small>${esc(errText)}</small>
        <button class="retry-btn" onclick="retryLast(this)">↺ Coba lagi</button>
      </div>
    </div>
  </div></div>`;
  $('msgs')?.appendChild(row);
  scrollBot();
}

function aiHdr(): string {
  return `<div class="ai-hdr"><div class="ai-av"><img src="/icon.png" style="width:100%;height:100%;object-fit:cover;object-position:top;border-radius:6px;" alt="Kiyora"></div><span class="ai-name">Kiyora<span class="ai-model">&nbsp;· Lite Fast 2.5</span></span></div>`;
}

function retryLast(btn: HTMLElement): void {
  btn.closest('.mrow')?.remove();
  if (!lastUserMsg) return;
  const inp = $('inp') as HTMLTextAreaElement | null;
  if (inp) inp.value = lastUserMsg;
  void doSend();
}

async function regenLast(): Promise<void> {
  if (busy || !cid || !convs[cid]) return;
  const msgs = convs[cid].msgs;
  let lastU = -1;
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].r === 'u') {
      lastU = i;
      break;
    }
  }
  if (lastU < 0) return;
  const rows = [...(document.getElementById('msgs')?.querySelectorAll('.mrow') ?? [])];
  if (rows.length) rows[rows.length - 1].remove();
  const newMsgs = msgs.slice(0, lastU + 1);
  convs[cid].msgs = newMsgs;
  lastUserMsg = msgs[lastU].c;
  setLoad(true);
  ctrl = new AbortController();
  try {
    let reply = '';
    let analysis = '';
    if (isCodingQ(lastUserMsg)) {
      showTyping('Re-analyzing…');
      try {
        analysis = await callAPI(mkAnalyzePrompt(lastUserMsg), ctrl.signal);
      } catch {
      }
      updateTyping('Re-generating…');
      reply = await callAPI(mkCodePrompt(lastUserMsg, analysis, newMsgs), ctrl.signal);
    } else {
      showTyping('Regenerating…');
      reply = await callAPI(mkGenPrompt(lastUserMsg, newMsgs), ctrl.signal);
    }
    removeTyping();
    addMsg('a', reply, true, analysis);
    newMsgs.push({ r: 'a', c: reply });
    saveConv(newMsgs);
  } catch (e) {
    removeTyping();
    if (!(e instanceof Error && e.name === 'AbortError')) {
      showErrMsg(e instanceof Error ? e.message : String(e));
    }
  } finally {
    setLoad(false);
    ctrl = null;
  }
}

function saveConv(msgs: ChatMsg[]): void {
  if (!cid) cid = Date.now().toString();
  convs[cid] = { msgs, ts: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  renderHist();
}

function showTyping(label: string): void {
  removeTyping();
  const el = $('msgs');
  if (!el) return;
  const r = document.createElement('div');
  r.id = 'typing';
  r.className = 'mrow a typing-row fi';
  r.innerHTML = `<div class="min"><div class="mc">
    <div class="ai-hdr"><div class="ai-av"><img src="/icon.png" style="width:100%;height:100%;object-fit:cover;object-position:top;border-radius:6px;" alt="Kiyora"></div><span class="ai-name">Kiyora<span class="ai-model">&nbsp;· Lite Fast 2.5</span></span></div>
    <div class="typing-status" id="t-status">${label || 'Thinking…'}</div>
    <div class="typing-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
  </div></div>`;
  el.appendChild(r);
  scrollBot();
}

function updateTyping(label: string): void {
  const s = $('t-status');
  if (s) s.textContent = label;
}

function removeTyping(): void {
  $('typing')?.remove();
}

function addMsg(role: 'u' | 'a', content: string, animate: boolean, thinking = ''): void {
  const el = $('msgs');
  if (!el) return;
  const row = document.createElement('div');
  row.className = 'mrow ' + (role === 'u' ? 'u' : 'a') + (animate ? ' fi' : '');

  if (role === 'u') {
    row.innerHTML = `<div class="min"><div class="u-bub">${escInline(content).replace(/\n/g, '<br>')}</div></div>`;
  } else {
    let thinkingHtml = '';
    if (thinking) {
      const formatted = thinking
        .replace(/1-REQUIREMENT:/g, '<strong>Requirement</strong>')
        .replace(/2-APPROACH:/g, '<strong>Approach</strong>')
        .replace(/3-TOOLS:/g, '<strong>Tools</strong>')
        .replace(/4-RISKS:/g, '<strong>Risks</strong>')
        .replace(/1-REQUIREMENTS:|REQUIREMENTS:/g, '<strong>Requirement</strong>')
        .replace(/2-ARCHITECTURE:|ARCHITECTURE:/g, '<strong>Approach</strong>')
        .replace(/3-TECH_STACK:|TECH:/g, '<strong>Tools</strong>')
        .replace(/4-SECURITY:|5-PERFORMANCE:|6-EDGE_CASES:|PITFALLS:/g, '<strong>Risks</strong>');
      const lineCount = thinking.split('\n').filter((l) => l.trim()).length;
      thinkingHtml = `<details class="thinking">
        <summary>
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/><circle cx="12" cy="12" r="10"/></svg>
          Reasoning — ${lineCount} analysis points
          <span style="margin-left:auto;font-size:10px;background:rgba(61,132,247,.15);color:var(--acc);padding:2px 7px;border-radius:10px;font-weight:600">Careful Mode</span>
        </summary>
        <div class="thinking-body">${formatted}</div>
      </details>`;
    }

    row.innerHTML = `<div class="min"><div class="mc">
      ${aiHdr()}
      ${thinkingHtml}
      <div class="mbody">${parseMD(content)}</div>
      <div class="macts">
        <button class="abt" onclick="copyMsg(this)"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</button>
        <button class="abt" onclick="regenLast()"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>Regenerate</button>
      </div>
    </div></div>`;
    row.querySelectorAll('pre code').forEach((b) => window.hljs?.highlightElement(b));
    row.querySelectorAll('.cb').forEach((cb) => {
      const code = cb.querySelector('code');
      if (code) {
        const lines = (code as HTMLElement).innerText.split('\n').length;
        const foot = document.createElement('div');
        foot.className = 'cb-foot';
        foot.textContent = `${lines} lines`;
        cb.appendChild(foot);
      }
    });
  }
  el.appendChild(row);
  if (animate) scrollBot();
}

function copyMsg(btn: HTMLElement): void {
  const t = (btn.closest('.mc')?.querySelector('.mbody') as HTMLElement | null)?.innerText ?? '';
  navigator.clipboard.writeText(t).then(() => {
    const o = btn.innerHTML;
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>Copied';
    setTimeout(() => {
      btn.innerHTML = o;
    }, 2000);
  });
}

function copyCode(btn: HTMLElement): void {
  const c = (btn.closest('.cb')?.querySelector('code') as HTMLElement | null)?.innerText ?? '';
  navigator.clipboard.writeText(c).then(() => {
    const o = btn.innerHTML;
    btn.innerHTML = '✓ Copied';
    setTimeout(() => {
      btn.innerHTML = o;
    }, 2000);
  });
}

export function exportChat(): void {
  if (!cid || !convs[cid]) return;
  const txt = convs[cid].msgs.map((m) => (m.r === 'u' ? 'You:\n' : 'Kiyora:\n') + m.c).join('\n\n────────\n\n');
  const a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(txt);
  a.download = 'kiyora-' + cid + '.txt';
  a.click();
}

function timeGreetWord(): string {
  const h = new Date().getHours();
  return h < 11 ? 'Pagi' : h < 15 ? 'Siang' : h < 18 ? 'Sore' : 'Malem';
}

function dayName(): string {
  return ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()];
}

function fadeSwap(el: HTMLElement | null, html: string, isHtml = true): void {
  if (!el) return;
  el.style.opacity = '0';
  setTimeout(() => {
    if (isHtml) el.innerHTML = html;
    else el.textContent = html;
    el.style.opacity = '1';
  }, 250);
}

const HERO_MSGS: Array<() => string> = [
  () =>
    `Halo! Aku <span style="background:linear-gradient(120deg,#3D84F7,#60A5FA,#93BFFF,#3D84F7);background-size:300%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmerBlue 4s linear infinite">Kiyora</span>`,
  () =>
    `${dayName()} yang asik sama <span style="background:linear-gradient(120deg,#3D84F7,#60A5FA,#93BFFF,#3D84F7);background-size:300%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmerBlue 4s linear infinite">Kiyora</span>`,
  () =>
    `${timeGreetWord()}! Ada yang bisa <span style="background:linear-gradient(120deg,#3D84F7,#60A5FA,#93BFFF,#3D84F7);background-size:300%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmerBlue 4s linear infinite">Kiyora</span> bantu?`,
  () =>
    `Yuk ngobrol sama <span style="background:linear-gradient(120deg,#3D84F7,#60A5FA,#93BFFF,#3D84F7);background-size:300%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmerBlue 4s linear infinite">Kiyora</span>`,
];

const SUB_LOCAL: string[] = [
  'AI asisten gen Z kamu · by Hanz',
  'Nanya apa aja bisa, siap jawab!',
  'Kiyora · fast & accurate',
  'Coding, ngobrol, atau riset — gas!',
  'Kiyora siap temani hari kamu',
  'Ditenagai Kiyora AI',
];

let heroIdx = 0;
let subIdx = 0;
let heroTimer: ReturnType<typeof setInterval> | null = null;

async function rotateSubtitle(): Promise<void> {
  const el = $('hero-sub');
  if (!el) return;
  subIdx++;
  if (subIdx % 2 === 0) {
    try {
      const q = 'Tulis satu kalimat singkat tips atau fakta menarik buat gen z Indonesia, max 10 kata, tanpa tanda kutip.';
      const txt = await Promise.race([
        callAI([{ r: 'u', c: q }]),
        new Promise<string>((_, reject) => setTimeout(() => reject('timeout'), 6000)),
      ]);
      const clean = (txt || '').trim().replace(/^["']|["']$/g, '');
      if (clean) {
        fadeSwap(el, clean, false);
        return;
      }
    } catch {
    }
  }
  fadeSwap(el, SUB_LOCAL[Math.floor(Math.random() * SUB_LOCAL.length)], false);
}

function rotateHero(): void {
  const el = $('hero-h1');
  if (!el) return;
  heroIdx = (heroIdx + 1) % HERO_MSGS.length;
  fadeSwap(el, HERO_MSGS[heroIdx]());
}

function startHeroRotation(): void {
  const h1 = $('hero-h1');
  if (!h1) return;
  void rotateSubtitle();
  heroTimer = setInterval(() => {
    const w = $('welcome');
    if (!w || w.style.display === 'none') {
      if (heroTimer) clearInterval(heroTimer);
      return;
    }
    rotateHero();
    void rotateSubtitle();
  }, 9000);
}
