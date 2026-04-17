'use client';

import { useEffect, useRef } from 'react';

// UUID Generator für eindeutige Visitor-ID
function generateVisitorId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Prüfe ob App als PWA läuft
function isPWA() {
  // Desktop PWA
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  // iOS PWA
  if (window.navigator.standalone === true) {
    return true;
  }
  // Android PWA (Chrome)
  if (document.referrer.includes('android-app://')) {
    return true;
  }
  return false;
}

export default function WebsiteStatsTracker() {
  const hasTrackedVisit = useRef(false);
  const hasTrackedVisitor = useRef(false);
  const hasTrackedPWA = useRef(false);

  useEffect(() => {
    // 1. Hole oder erstelle Visitor ID
    let visitorId = localStorage.getItem('hhrp_visitor_id');
    if (!visitorId) {
      visitorId = generateVisitorId();
      localStorage.setItem('hhrp_visitor_id', visitorId);
      console.log('[Stats] Neuer Visitor ID erstellt:', visitorId);
    }

    // 2. Track Visit (jedes Mal)
    if (!hasTrackedVisit.current) {
      fetch('/api/stats/visit', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId })
      })
        .then(res => res.json())
        .then(() => {
          console.log('[Stats] ✅ Visit getrackt');
          hasTrackedVisit.current = true;
        })
        .catch(err => console.error('[Stats] Visit tracking failed:', err));
    }

    // 3. Track Unique Visitor (nur 1x pro Session)
    const hasVisitedThisSession = sessionStorage.getItem('hhrp_session_tracked');
    if (!hasVisitedThisSession && !hasTrackedVisitor.current) {
      fetch('/api/stats/unique-visitor', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId })
      })
        .then(res => res.json())
        .then(() => {
          console.log('[Stats] ✅ Unique Visitor getrackt');
          sessionStorage.setItem('hhrp_session_tracked', 'true');
          hasTrackedVisitor.current = true;
        })
        .catch(err => console.error('[Stats] Unique visitor tracking failed:', err));
    }

    // 4. Track PWA-Nutzung (nur wenn als PWA läuft)
    const isPWAMode = isPWA();
    if (isPWAMode) {
      console.log('[Stats] 🚀 App läuft als PWA!');
      
      const hasPWATrackedToday = localStorage.getItem('hhrp_pwa_tracked_date');
      const today = new Date().toDateString();
      
      // Track PWA-Session nur 1x pro Tag
      if (hasPWATrackedToday !== today && !hasTrackedPWA.current) {
        fetch('/api/stats/pwa-session', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId })
        })
          .then(res => res.json())
          .then(() => {
            console.log('[Stats] ✅ PWA-Session getrackt');
            localStorage.setItem('hhrp_pwa_tracked_date', today);
            hasTrackedPWA.current = true;
          })
          .catch(err => console.error('[Stats] PWA tracking failed:', err));
      }
    } else {
      console.log('[Stats] 🌐 App läuft im Browser (kein PWA)');
    }

    // 5. Track PWA Installation Event
    const handleAppInstalled = () => {
      console.log('[Stats] 🎉 PWA wurde installiert!');
      
      fetch('/api/stats/app-install', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId })
      })
        .then(res => res.json())
        .then(() => {
          console.log('[Stats] ✅ App-Install getrackt');
          localStorage.setItem('hhrp_app_installed', 'true');
        })
        .catch(err => console.error('[Stats] App install tracking failed:', err));
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return null; // Invisible tracker component
}
