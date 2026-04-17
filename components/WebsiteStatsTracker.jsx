'use client';

import { useEffect, useRef } from 'react';

export default function WebsiteStatsTracker() {
  const hasTrackedVisit = useRef(false);
  const hasTrackedUniqueVisitor = useRef(false);

  useEffect(() => {
    // Track Visit (jedes Mal wenn die Seite geladen wird)
    if (!hasTrackedVisit.current) {
      fetch('/api/stats/visit', { method: 'POST' })
        .then(res => res.json())
        .then(() => {
          console.log('[Stats] Visit tracked');
          hasTrackedVisit.current = true;
        })
        .catch(err => console.error('[Stats] Visit tracking failed:', err));
    }

    // Track Unique Visitor (nur 1x pro Session)
    const hasVisitedBefore = sessionStorage.getItem('hhrp_visitor_tracked');
    if (!hasVisitedBefore && !hasTrackedUniqueVisitor.current) {
      fetch('/api/stats/unique-visitor', { method: 'POST' })
        .then(res => res.json())
        .then(() => {
          console.log('[Stats] Unique visitor tracked');
          sessionStorage.setItem('hhrp_visitor_tracked', 'true');
          hasTrackedUniqueVisitor.current = true;
        })
        .catch(err => console.error('[Stats] Unique visitor tracking failed:', err));
    }

    // Track PWA Installation
    let deferredPrompt;
    
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPrompt = e;
    };
    
    const handleAppInstalled = () => {
      console.log('[Stats] PWA installed!');
      
      fetch('/api/stats/app-install', { method: 'POST' })
        .then(res => res.json())
        .then(() => {
          console.log('[Stats] App install tracked');
          localStorage.setItem('hhrp_app_installed', 'true');
        })
        .catch(err => console.error('[Stats] App install tracking failed:', err));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return null; // Invisible tracker component
}
