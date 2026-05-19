import { useCallback, useSyncExternalStore } from "react";

export interface CookieConsent {
  necessary: true; // always true
  functional: boolean;
  analytics: boolean;
  ts: number; // unix ms when chosen
}

const STORAGE_KEY = "niwe-cookie-consent-v1";
const EVT = "niwe-cookie-consent-change";

// useSyncExternalStore requires getSnapshot to return a stable reference when
// the underlying data hasn't changed — otherwise React falls into an infinite
// re-render loop (which manifests as a frozen/white screen). We cache the
// parsed value keyed by the raw localStorage string and only re-parse when it
// actually changes.
let cachedRaw: string | null = null;
let cachedValue: CookieConsent | null = null;

function read(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  if (!raw) {
    cachedValue = null;
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (typeof parsed.ts !== "number") {
      cachedValue = null;
      return null;
    }
    cachedValue = {
      necessary: true,
      functional: parsed.functional === true,
      analytics: parsed.analytics === true,
      ts: parsed.ts,
    };
    return cachedValue;
  } catch {
    cachedValue = null;
    return null;
  }
}

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function useCookieConsent() {
  const consent = useSyncExternalStore(subscribe, read, () => null);

  const save = useCallback((next: { functional: boolean; analytics: boolean }) => {
    const value: CookieConsent = {
      necessary: true,
      functional: next.functional,
      analytics: next.analytics,
      ts: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    window.dispatchEvent(new Event(EVT));
  }, []);

  const reset = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(EVT));
  }, []);

  return { consent, save, reset, hasChoice: consent !== null };
}

// Allows opening the settings dialog from anywhere (e.g. the footer link)
const OPEN_EVT = "niwe-cookie-open-settings";
export function openCookieSettings(): void {
  window.dispatchEvent(new Event(OPEN_EVT));
}
export function onOpenCookieSettings(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener(OPEN_EVT, handler);
  return () => window.removeEventListener(OPEN_EVT, handler);
}
