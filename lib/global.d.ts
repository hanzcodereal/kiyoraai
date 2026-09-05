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
    downloadImg?: (btn: HTMLElement) => void;
    zoomImg?: (btn: HTMLElement) => void;
    closeZoom?: () => void;
  }
}
