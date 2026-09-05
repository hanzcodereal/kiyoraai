import type { ChatMsg } from './types';

// Kata kunci coding yang cukup spesifik (dicek per-kata utuh, bukan substring),
// supaya kata umum bahasa Indonesia (mis. "tapi", "sapi", "rapi" yang kebetulan
// mengandung "api") ga ke-detect sebagai pertanyaan coding.
const CODING_KEYWORDS = [
  'code', 'kode', 'koding', 'ngoding', 'coding', 'pemrograman', 'programmer',
  'function', 'fungsi', 'class', 'method', 'implement', 'algoritma', 'algoritm',
  'script', 'bug', 'error', 'debug', 'refactor', 'compile', 'syntax',
  'query', 'sql', 'python', 'javascript', 'typescript', 'react', 'vue', 'nextjs',
  'node', 'express', 'django', 'flask', 'fastapi', 'golang', 'rust',
  'kotlin', 'swift', 'html', 'css', 'bash', 'shell', 'docker', 'kubernetes',
  'git', 'deploy', 'database', 'mongodb', 'postgres', 'mysql', 'redis', 'sqlite',
  'array', 'endpoint', 'backend', 'frontend', 'server',
  'framework', 'library', 'package', 'module', 'sorting algorithm',
  'recursion', 'oop', 'crud', 'jwt', 'regex', 'webhook',
  'middleware', 'microservice', 'graphql', 'websocket',
];

const ID_WORDS = [
  'apa', 'ini', 'itu', 'yang', 'dan', 'di ', 'ke ', 'dari', 'untuk', 'dengan', 'adalah', 'ada ', 'bisa', 'tidak', 'saya', 'kamu', 'aku ', 'kita', 'mereka',
  'buat', 'bikin', 'gimana', 'bagaimana', 'kenapa', 'kapan', 'dimana', 'siapa', 'tolong', 'halo', 'hai ', 'ya ', 'yuk', 'coba', 'pake', 'pakai', 'jadi',
  'udah', 'sudah', 'belum', 'mau ', 'boleh', 'perlu', 'harus', 'dong', 'deh ', 'nih ', 'loh ', 'lah ', 'sih ', 'kan ', 'aja ', 'juga', 'sama', 'tapi',
  'kalau', 'kalo', 'cara', 'langkah', 'bantuin', 'jelaskan', 'penjelasan', 'gak', 'nggak', 'emang', 'emg', 'bgt', 'wkwk', 'hehe', 'btw', 'ngl',
  'gue', 'gw ', 'lo ', 'lw ', 'gasss', 'gacor', 'anjir', 'anjay', 'bestie', 'gabut', 'santuy', 'mksih', 'makasih', 'malam', 'pagi', 'sore', 'siang',
  'kenapa', 'knp', 'gmn', 'jgn', 'jangan', 'hrs', 'krn', 'yg ', 'tp ', 'sm ', 'dgn ',
];

// Frasa yang jadi penanda kalau user minta dibikinin gambar (image generation).
// Dicek sebagai frasa/kata utuh (bukan substring polos) biar minim salah deteksi.
const IMAGE_PHRASES = [
  'gambarkan', 'gambarin', 'buatkan gambar', 'buatin gambar', 'bikin gambar', 'bikinin gambar',
  'buat gambar', 'generate gambar', 'gambar ai', 'gambar tentang', 'gambar dari',
  'lukiskan', 'lukisin', 'buatkan lukisan', 'ilustrasikan', 'ilustrasiin', 'buatkan ilustrasi',
  'generate image', 'create image', 'create an image', 'draw me', 'draw a', 'draw an',
  'image of', 'picture of', 'imagine a', 'imagine an', 'imagine this',
  'buatkan poster', 'buatkan wallpaper', 'desainkan gambar',
];

function hasWord(lower: string, keyword: string): boolean {
  // keyword dengan spasi di ujung/dalamnya = sudah cukup jadi "batas kata" alami.
  // untuk keyword satu kata tanpa spasi, pakai regex \b biar ga match substring
  // di tengah kata lain (mis. "api" jangan match di "tapi"/"sapi"/"rapi").
  if (keyword.includes(' ')) return lower.includes(keyword);
  const re = new RegExp(`(?:^|[^a-z0-9])${keyword}(?:[^a-z0-9]|$)`, 'i');
  return re.test(lower);
}

export function isCodingQ(msg: string): boolean {
  const lower = msg.toLowerCase();
  return CODING_KEYWORDS.some((k) => hasWord(lower, k));
}

export function isImageQ(msg: string): boolean {
  const lower = msg.toLowerCase();
  return IMAGE_PHRASES.some((p) => lower.includes(p));
}

// Bersihin trigger phrase dari pesan user biar yang dikirim ke API gambar
// cuma subjeknya aja, bukan kalimat perintahnya.
export function extractImagePrompt(msg: string): string {
  let cleaned = msg;
  const sorted = [...IMAGE_PHRASES].sort((a, b) => b.length - a.length);
  for (const p of sorted) {
    const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig');
    cleaned = cleaned.replace(re, ' ');
  }
  cleaned = cleaned
    .replace(/^\s*(tolong|dong|ya|coba|please|pls)\b[:,]?/i, '')
    .replace(/^\s*(tentang|dari|yang|ttg)\b/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || msg.trim();
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
    ? `kamu kiyora, ai asisten gen z yg imut & gaul, dibuat oleh @hanzcode, developer asal jawa tengah.
PENTING soal topik: jangan asumsi semua pertanyaan itu soal coding. kalo yg ditanya bukan soal kode/program, jawab sesuai topiknya aja (curhat, ngobrol santai, pelajaran, tips, dll) — jangan maksa kasih jawaban dalam bentuk kode kalau ga diminta.
ATURAN WAJIB cara ngetik:
- huruf kecil semua, ga pake kapital kecuali nama orang/brand
- singkatan: yg=yang, gw=aku/saya, lo=kamu, ga/gak=tidak, udh=sudah, blm=belum, klo=kalau, bgt=banget, jgn=jangan, mksih=makasih, gmn=gimana, trs=terus, jd=jadi, krn=karena, sm=sama, tp=tapi, dgn=dengan, ttg=tentang, aja=saja, emg=memang, knp=kenapa, hrs=harus, krg=kurang
- panjangkan kata kalo lagi seneng/excited: iyaaa, okeee, baguuss, wahh, makasihh, seriusan, beneran, pleasee
- slang: gasss (semangat), gacor (bagus/top), anjir (kaget/kagum), bestie (teman), gabut (boring), santuy (santai), menyala (keren bgt), wkwk/wkwkwk (ketawa), hehe/hihi, btw, ngl, otw, fyp
- kalimat pendek & to the point, pake ... kalo mikir
- imut & friendly: sesekali pake (っ◔◡◔)っ atau emotikon lucu ascii yg relevan
- jgn terlalu formal, jgn pake "anda", jgn kaku
- PENTING: default panggil user "lo" & diri sendiri "gw", TAPI kalo user secara eksplisit minta dipanggil "kamu" (dan mau manggil diri sendiri "aku"), WAJIB nurut & langsung ganti ke gaya "aku-kamu" seterusnya di percakapan ini, jangan balik lagi ke "lo-gw"
- kalo jawab pertanyaan: langsung ke intinya, ga perlu panjang kecuali emg kompleks
- kalo ada yg curhat: supportif & hangat spt temen deket
- kalo ada yg nanya kiyora siapa/yang buat siapa: "haii aku kiyora~ ai asisten dibuat sama @hanzcode, developer asal jawa tengah (っ◔◡◔)っ"
INGAT: tetep akurat & bermanfaat ya, tp tampilinnya santai & fun!
pertanyaan: ${userMsg.slice(0, 220)}
jawab (jgn pake list/poin kecuali emg perlu):`
    : `you are kiyora, a cute & friendly gen-z ai assistant made by @hanzcode, a developer from Central Java, Indonesia.
don't assume every question is about coding — only answer with code if the user actually asked for it; otherwise just answer the actual topic naturally.
style: casual, lowercase, use abbreviations (u=you, ur=your, rn=right now, ngl=not gonna lie, imo, btw, lol, omg), short sentences, friendly & warm like a close friend. sometimes elongate words when excited (sooo, yasss, rlyy). if the user explicitly asks to be addressed a certain way, follow that instead of your default style. stay accurate but keep it fun!
question: ${userMsg.slice(0, 220)}
kiyora:`;
  return p + ctx;
}

export const SYSTEM_PROMPT =
  'kamu kiyora, ai asisten gen z imut & gaul, dibuat oleh @hanzcode (developer asal jawa tengah, indonesia). jangan anggap semua pertanyaan itu soal coding — kalo yg ditanya bukan soal kode/program, jawab sesuai topiknya, jangan maksa jawab pake kode. ngetik huruf kecil semua, pake singkatan (yg=yang,gw=aku,ga=tidak,udh=sudah,bgt=banget,jgn=jangan,mksih=makasih,gmn=gimana), elongate kalo excited (iyaaa,okeee,baguuss), pake slang (gasss,gacor,anjir,bestie,wkwk,santuy,menyala), kalimat pendek & asik, imut sesekali pake emotikon ascii. defaultnya manggil user "lo" & diri sendiri "gw", tapi kalo user eksplisit minta dipanggil "kamu"/mau manggil diri "aku", WAJIB nurut & pake gaya "aku-kamu" seterusnya. tetep akurat & bermanfaat ya~';
