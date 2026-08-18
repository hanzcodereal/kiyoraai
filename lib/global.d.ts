// Ambient types for the highlight.js UMD global loaded via <Script> in
// app/layout.tsx, and the handful of window-level functions we expose so
// that generated innerHTML (onclick="...") strings keep working.
export {};

declare global {
  interface Window {
    hljs?: {
      highlightElement: (el: Element) => void;
      getLanguage: (name: string) => unknown;
    };
    copyCode?: (btn: HTMLElement) => void;
    copyMsg?: (btn: HTMLElement) => void;
    regenLast?: () => void;
    retryLast?: (btn: HTMLElement) => void;
  }
}
