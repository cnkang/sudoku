/** The PWA manager owns registration and browser event listeners. */
'use client';
import { useEffect } from 'react';
import { pwaManager } from '@/utils/pwa';
export default function PWAInit() {
  useEffect(() => {
    pwaManager.initialize();
  }, []);
  return null;
}
