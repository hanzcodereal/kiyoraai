interface BatteryManager extends EventTarget {
  level: number;
  addEventListener(type: 'levelchange', listener: () => void): void;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

export function initSplash(): void {
  const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
    'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const now = new Date();
  const h = now.getHours();
  const greeting = h < 11 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 18 ? 'Selamat Sore' : 'Selamat Malam';

  const greetEl = $('sp-day-greeting');
  if (greetEl) greetEl.textContent = greeting;
  const dateEl = $('sp-date-str');
  if (dateEl) dateEl.textContent = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const nav = navigator as NavigatorWithBattery;
  const pctEl = $('batt-pct');
  const fillEl = $('batt-fill');
  const bodyEl = $('batt-body');

  if (nav.getBattery) {
    nav
      .getBattery()
      .then((bat) => {
        const pct = Math.round(bat.level * 100);
        if (pctEl) pctEl.textContent = pct + '%';
        if (fillEl) fillEl.style.width = pct + '%';
        if (pct <= 20) bodyEl?.classList.add('low');
        else if (pct <= 50) bodyEl?.classList.add('mid');
        bat.addEventListener('levelchange', () => {
          const p2 = Math.round(bat.level * 100);
          if (pctEl) pctEl.textContent = p2 + '%';
          if (fillEl) fillEl.style.width = p2 + '%';
        });
      })
      .catch(() => {
        if (pctEl) pctEl.textContent = '?? %';
        if (fillEl) fillEl.style.width = '60%';
      });
  } else {
    if (pctEl) pctEl.textContent = 'N/A';
    if (fillEl) fillEl.style.width = '70%';
  }
}

export function initLoadingBar(): void {
  const bar = $('ld-bar');
  const status = $('ld-status');
  const ld = $('loading');
  if (!bar || !status || !ld) return;

  const steps: Array<[number, string]> = [
    [15, 'Memuat aset…'],
    [35, 'Menyiapkan antarmuka…'],
    [60, 'Inisialisasi AI…'],
    [80, 'Membangun tampilan…'],
    [100, 'Siap!'],
  ];

  let stepIdx = 0;
  function nextStep(): void {
    if (stepIdx >= steps.length || !bar || !status) return;
    const [pct, msg] = steps[stepIdx++];
    bar!.style.width = pct + '%';
    status!.textContent = msg;
  }

  const timer = setInterval(() => {
    if (stepIdx < steps.length - 1) nextStep();
    else clearInterval(timer);
  }, 320);

  function hideLoading(): void {
    clearInterval(timer);
    if (bar) bar.style.width = '100%';
    if (status) status.textContent = 'Siap!';
    setTimeout(() => {
      ld?.classList.add('fade-out');
      setTimeout(() => {
        if (ld) ld.style.display = 'none';
      }, 500);
    }, 250);
  }

  setTimeout(hideLoading, 3500);
}

export function enterApp(): void {
  const sp = $('splash');
  if (!sp) return;
  sp.classList.add('hiding');
  setTimeout(() => {
    sp.style.display = 'none';
  }, 700);
}
