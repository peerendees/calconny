"use client";

import { useEffect, useRef } from "react";

/**
 * Prüft auf neue Service-Worker-Versionen und lädt bei Aktivierung neu,
 * damit nach einem Deploy die PWA den aktuellen Stand nutzt.
 */
export function PwaUpdateNotifier() {
  const refreshing = useRef(false);
  const regRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const onControllerChange = () => {
      if (refreshing.current) return;
      refreshing.current = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    void navigator.serviceWorker.ready.then((r) => {
      regRef.current = r;
    });

    const interval = window.setInterval(() => {
      regRef.current?.update().catch(() => {});
    }, 60 * 60 * 1000);

    const onFocus = () => {
      regRef.current?.update().catch(() => {});
    };
    window.addEventListener("focus", onFocus);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return null;
}
