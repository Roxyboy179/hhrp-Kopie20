'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function PWANotifications({ userData, isPWA, discordUserId }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isPWA) return;
    
    // Check notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setNotificationsEnabled(Notification.permission === 'granted');
      console.log('[PWA Notifications] Permission:', Notification.permission);
    }
  }, [isPWA]);

  // Permission anfordern und Backend-Subscription erstellen
  const requestPermission = async () => {
    console.log('[PWA Notifications] Requesting permission...');
    
    if (!('Notification' in window)) {
      toast.error('Benachrichtigungen werden von deinem Browser nicht unterstützt');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      toast.error('Service Worker wird nicht unterstützt');
      return;
    }

    if (!discordUserId) {
      toast.error('Discord User ID nicht gefunden. Bitte einloggen.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Request Notification Permission
      const result = await Notification.requestPermission();
      console.log('[PWA Notifications] Permission result:', result);
      setPermission(result);
      
      if (result !== 'granted') {
        toast.error('Benachrichtigungen wurden abgelehnt');
        setIsLoading(false);
        return;
      }

      // 2. Wait for Service Worker to be ready
      console.log('[PWA Notifications] Waiting for Service Worker...');
      const registration = await navigator.serviceWorker.ready;
      console.log('[PWA Notifications] Service Worker ready:', registration);
      
      // 3. VAPID Public Key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
        'BIPDbB4VQiAVOxuBbuMTso8GxtbAno4hsZtXb2vQIw1cUqEu61U5vyz_rYIrdCtvaWOEM67yuukPeTgbKuaZMBQ';
      
      console.log('[PWA Notifications] VAPID Key:', vapidPublicKey.substring(0, 20) + '...');
      
      // 4. Convert VAPID Key
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      console.log('[PWA Notifications] Converted VAPID Key');
      
      // 5. Create Push Subscription
      console.log('[PWA Notifications] Creating push subscription...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      
      console.log('[PWA Notifications] Subscription created:', subscription);

      // 6. Send to Backend with Discord User ID
      console.log('[PWA Notifications] Sending to backend with User ID:', discordUserId);
      
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId: discordUserId
        })
      });

      console.log('[PWA Notifications] Backend response status:', response.status);
      const data = await response.json();
      console.log('[PWA Notifications] Backend response data:', data);

      if (response.ok) {
        setNotificationsEnabled(true);
        toast.success('Benachrichtigungen aktiviert! 🔔');
        toast.info('Du erhältst jetzt Benachrichtigungen, auch wenn die App geschlossen ist!');
      } else {
        throw new Error(data.error || 'Backend error');
      }
    } catch (error) {
      console.error('[PWA Notifications] Error:', error);
      toast.error('Fehler beim Aktivieren: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper-Funktion für VAPID Key Konvertierung
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (!isPWA) return null;

  return (
    <div className="flex items-center gap-3 mb-6">
      {notificationsEnabled ? (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400 font-medium">Benachrichtigungen aktiv</span>
        </div>
      ) : permission === 'denied' ? (
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20 w-full">
          <div className="flex items-center gap-2">
            <BellOff className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400 font-medium">Benachrichtigungen blockiert</span>
          </div>
          <p className="text-xs text-red-300">
            Gehe in deine Browser-Einstellungen und erlaube Benachrichtigungen für diese Website.
          </p>
        </div>
      ) : (
        <button
          onClick={requestPermission}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Bell className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-400 font-medium">
            {isLoading ? 'Aktiviere...' : 'Benachrichtigungen aktivieren'}
          </span>
        </button>
      )}
    </div>
  );
}
