'use client';

import { useEffect } from 'react';

/** Registers the offline shell service worker. It renders nothing. */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support is optional. The app works without the service worker.
    });
  }, []);

  return null;
}
