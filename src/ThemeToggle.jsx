import React, { useSyncExternalStore } from "react";

const storageKey = "jlpt-study-theme";
const listeners = new Set();
let theme = "dark";
try {
  if (localStorage.getItem(storageKey) === "light") theme = "light";
} catch { /* The toggle also works when browser storage is unavailable. */ }
document.documentElement.dataset.theme = theme;

function applyTheme(next) {
  theme = next;
  document.documentElement.dataset.theme = theme;
  listeners.forEach((notify) => notify());
}
window.addEventListener("storage", (event) => {
  if (event.key === storageKey || event.key === null) {
    applyTheme(event.newValue === "light" ? "light" : "dark");
  }
});
const subscribe = (notify) => {
  listeners.add(notify);
  return () => listeners.delete(notify);
};

export default function ThemeToggle() {
  const current = useSyncExternalStore(subscribe, () => theme);
  const dark = current === "dark";
  return <button type="button" className="theme-toggle" aria-label="Dark mode" aria-pressed={dark}
    title={dark ? "Switch to light mode" : "Switch to dark mode"}
    onClick={() => {
      const next = dark ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(storageKey, next); } catch { /* Keep the session preference. */ }
    }}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {dark ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> : <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" />}
    </svg>
    <span>{dark ? "Light mode" : "Dark mode"}</span>
  </button>;
}
