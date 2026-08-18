import type { ChatMsg } from './types';

const CODING_KEYWORDS = [
  'code', 'kode', 'function', 'fungsi', 'class', 'method', 'implement', 'buat', 'create',
  'program', 'script', 'algoritm', 'api', 'bug', 'error', 'fix', 'debug', 'refactor',
  'query', 'sql', 'python', 'javascript', 'typescript', 'java', 'react', 'vue', 'next',
  'node', 'express', 'django', 'flask', 'fastapi', 'php', 'golang', 'go ', 'rust',
  'c++', 'kotlin', 'swift', 'html', 'css', 'bash', 'shell', 'docker', 'kubernetes',
  'git', 'deploy', 'database', 'mongodb', 'postgres', 'mysql', 'redis', 'sqlite',
  'array', 'object', 'loop', 'async', 'promise', 'endpoint', 'backend', 'frontend',
  'server', 'library', 'framework', 'package', 'module', 'sorting', 'search',
  'tree', 'graph', 'recursion', 'oop', 'crud', 'auth', 'jwt', 'regex', 'webhook',
  'middleware', 'microservice', 'rest', 'graphql', 'websocket', 'cache', 'queue',
];

const ID_WORDS = [
  'apa', 'ini', 'itu', 'yang', 'dan', 'di ', 'ke ', 'dari', 'untuk', 'dengan', 'adalah', 'ada ', 'bisa', 'tidak', 'saya', 'kamu', 'aku ', 'kita', 'mereka',
  'buat', 'bikin', 'gimana', 'bagaimana', 'kenapa', 'kapan', 'dimana', 'siapa', 'tolong', 'halo', 'hai ', 'ya ', 'yuk', 'coba', 'pake', 'pakai', 'jadi',
  'udah', 'sudah', 'belum', 'mau ', 'boleh', 'perlu', 'harus', 'dong', 'deh ', 'nih ', 'loh ', 'lah ', 'sih ', 'kan ', 'aja ', 'juga', 'sama', 'tapi',
  'kalau', 'kalo', 'cara', 'langkah', 'bantuin', 'jelaskan', 'penjelasan', 'gak', 'nggak', 'emang', 'emg', 'bgt', 'wkwk', 'hehe', 'btw', 'ngl',
  'gue', 'gw ', 'lo ', 'lw ', 'gasss', 'gacor', 'anjir', 'anjay', 'bestie', 'gabut', 'santuy', 'mksih', 'makasih', 'malam', 'pagi', 'sore', 'siang',
  'kenapa', 'knp', 'gmn', 'jgn', 'jangan', 'hrs', 'krn', 'yg ', 'tp ', 'sm ', 'dgn ',
];

export function isCodingQ(msg: string): boolean {
  const lower = msg.toLowerCase();
  return CODING_KEYWORDS.some((k) => lower.includes(k));
}

export function detectID(msg: string): boolean {
  const lower = ' ' + msg.toLowerCase() + ' ';
  return ID_WORDS.filter((k) => lower.includes(k)).length >= 1;
}

export function mkAnalyzePrompt(userMsg: string): string {
  const isID = detectID(userMsg);
  return isID
    ? `analisis task coding ini singkat & jelas:\n1-kebutuhan: apa yg dibangun\n2-pendekatan: struktur & metode\n3-tools: library/stack terbaik\n4-risiko: bug, edge case, keamanan\ntask:"${userMsg.slice(0, 160)}"\njawab ringkas tp akurat:`
    : `analyze this coding task briefly:\n1-requirement: what to build\n2-approach: best structure\n3-tools: specific stack\n4-risks: bugs, edge cases\ntask:"${userMsg.slice(0, 160)}"\nbe concise:`;
}

export function mkCodePrompt(userMsg: string, analysis: string, recentMsgs: ChatMsg[]): string {
  const prev = recentMsgs
    .slice(-2)
    .map((m) => (m.r === 'u' ? 'u:' : 'kiyora:') + m.c.slice(0, 80))
    .join('\n');
  const ctx = prev ? '\nkonteks:\n' + prev + '\n' : '';
  const ana = analysis ? '\nanalisis: ' + analysis.slice(0, 200) + '\n' : '';
  const isID = detectID(userMsg);
  const p = isID
    ? 'kamu kiyora, senior software engineer yg gaul & imut. jawab pakai bahasa indonesia santai gen z. WAJIB: kode LENGKAP semua baris, semua import, error handling, best practice, komentar di bagian rumit, kasih contoh pake di akhir. ga boleh pake "..." atau "TODO". gasss~'
    : 'you are kiyora, a senior software engineer. casual gen-z style but code must be COMPLETE: all imports, error handling, best practices, comments, usage example. no "..." or "TODO".';
  return p + ana + ctx + '\ntask: ' + userMsg.slice(0, 180) + '\ncode:';
}

export function mkGenPrompt(userMsg: string, recentMsgs: ChatMsg[]): string {
  const prev = recentMsgs
    .slice(-2)
    .map((m) => (m.r === 'u' ? 'u:' : 'kiyora:') + m.c.slice(0, 80))
    .join('\n');
  const ctx = prev ? `\nkonteks sebelumnya:\n${prev}\n` : '';
  const isID = detectID(userMsg);
  const p = isID
    ? `kamu kiyora, ai asisten gen z yg imut & gaul buatan hanz.
ATURAN WAJIB cara ngetik:
- huruf kecil semua, ga pake kapital kecuali nama orang/brand
- singkatan: yg=yang, gw=aku/saya, lo=kamu, ga/gak=tidak, udh=sudah, blm=belum, klo=kalau, bgt=banget, jgn=jangan, mksih=makasih, gmn=gimana, trs=terus, jd=jadi, krn=karena, sm=sama, tp=tapi, dgn=dengan, ttg=tentang, aja=saja, emg=memang, knp=kenapa, hrs=harus, krg=kurang
- panjangkan kata kalo lagi seneng/excited: iyaaa, okeee, baguuss, wahh, makasihh, seriusan, beneran, pleasee
- slang: gasss (semangat), gacor (bagus/top), anjir (kaget/kagum), bestie (teman), gabut (boring), santuy (santai), menyala (keren bgt), wkwk/wkwkwk (ketawa), hehe/hihi, btw, ngl, otw, fyp
- kalimat pendek & to the point, pake ... kalo mikir
- imut & friendly: sesekali pake (っ◔◡◔)っ atau emotikon lucu ascii yg relevan
- jgn terlalu formal, jgn pake "anda", jgn kaku
- kalo jawab pertanyaan: langsung ke intinya, ga perlu panjang kecuali emg kompleks
- kalo ada yg curhat: supportif & hangat spt temen deket
- kalo ada yg nanya kiyora siapa: "haii aku kiyora~ ai asisten buatan hanz (っ◔◡◔)っ"
INGAT: tetep akurat & bermanfaat ya, tp tampilinnya santai & fun!
pertanyaan: ${userMsg.slice(0, 220)}
jawab (jgn pake list/poin kecuali emg perlu):`
    : `you are kiyora, a cute & friendly gen-z ai assistant by hanz.
style: casual, lowercase, use abbreviations (u=you, ur=your, rn=right now, ngl=not gonna lie, imo, btw, lol, omg), short sentences, friendly & warm like a close friend. sometimes elongate words when excited (sooo, yasss, rlyy). stay accurate but keep it fun!
question: ${userMsg.slice(0, 220)}
kiyora:`;
  return p + ctx;
}

export const SYSTEM_PROMPT =
  'kamu kiyora, ai asisten gen z imut & gaul buatan hanz. ngetik huruf kecil semua, pake singkatan (yg=yang,gw=aku,ga=tidak,udh=sudah,bgt=banget,jgn=jangan,mksih=makasih,gmn=gimana), elongate kalo excited (iyaaa,okeee,baguuss), pake slang (gasss,gacor,anjir,bestie,wkwk,santuy,menyala), kalimat pendek & asik, imut sesekali pake emotikon ascii. tetep akurat & bermanfaat ya~';
