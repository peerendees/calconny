"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "calconny-theme";

function subscribe(callback: () => void) {
  const el = document.documentElement;
  const observer = new MutationObserver(callback);
  observer.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.getAttribute("data-theme") === "light";
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle() {
  const light = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !light;
    const root = document.documentElement;
    if (next) {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem(STORAGE_KEY, next ? "light" : "dark");
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-[var(--border)] bg-[var(--card)] text-lg text-[var(--text)] transition-colors hover:border-[var(--copper)]"
      aria-label="Hell- und Dunkelmodus wechseln"
    >
      <span className="sr-only">Theme wechseln</span>
      <span aria-hidden>{light ? "☾" : "☀"}</span>
    </button>
  );
}
