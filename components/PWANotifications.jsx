'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function PWANotifications({ userData, isPWA }) {
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

      // 6. Send to Backend
      console.log('[PWA Notifications] Sending to backend...');
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId: userData?.character?.name || userData?.user_id || 'unknown'
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


  // Cooldown-Tracking
  useEffect(() => {
    if (!isPWA || !notificationsEnabled || !userData?.cooldowns) return;

    const checkCooldowns = () => {
      const now = Date.now();
      const cooldowns = userData.cooldowns;

      Object.entries(cooldowns).forEach(([key, startTime]) => {
        // Berechne End-Zeit basierend auf Cooldown-Typ
        let duration = 4 * 60 * 60 * 1000; // 4h default (collect)
        
        // VIP-Status prüfen für dynamische Collect-Cooldown
        const licenses = userData?.licenses || [];
        if (key === 'collect') {
          if (licenses.includes('vip_elite_plus') || licenses.includes('vip_ultimate')) {
            duration = 45 * 60 * 1000; // 45 Min
          } else if (licenses.includes('vip_platinum')) {
            duration = 1 * 60 * 60 * 1000; // 1h
          } else if (licenses.includes('vip_premium')) {
            duration = 2 * 60 * 60 * 1000; // 2h
          }
        } else if (key === 'ueberfall') {
          duration = 24 * 60 * 60 * 1000; // 24h
        } else if (key === 'elitePlusDaily') {
          duration = 24 * 60 * 60 * 1000; // 24h
        }

        const endTime = startTime + duration;
        const timeLeft = endTime - now;

        // Benachrichtige 1 Minute VOR Ablauf (nur einmal)
        const notificationKey = `notified_${key}_${startTime}`;
        const hasNotified = localStorage.getItem(notificationKey);

        if (timeLeft > 0 && timeLeft <= 60000 && !hasNotified) {
          // Cooldown läuft in 1 Minute ab
          const cooldownNames = {
            collect: '💰 Gehalt abholen',
            ueberfall: '🔫 Überfall',
            elitePlusDaily: '⭐ Elite+ Daily',
            work: '💼 Arbeiten'
          };

          sendNotification({
            title: `${cooldownNames[key] || key} verfügbar!`,
            body: 'Dein Cooldown läuft in 1 Minute ab!',
            icon: '/icon-512.png',
            tag: `cooldown_${key}`,
            url: '/profil'
          });

          localStorage.setItem(notificationKey, 'true');
        }

        // Benachrichtige wenn Cooldown JETZT verfügbar ist
        if (timeLeft <= 0 && !hasNotified) {
          const cooldownNames = {
            collect: '💰 Gehalt abholen',
            ueberfall: '🔫 Überfall',
            elitePlusDaily: '⭐ Elite+ Daily',
            work: '💼 Arbeiten'
          };

          sendNotification({
            title: `✅ ${cooldownNames[key] || key} verfügbar!`,
            body: 'Du kannst jetzt wieder den Command ausführen!',
            icon: '/icon-512.png',
            tag: `cooldown_ready_${key}`,
            url: '/profil',
            requireInteraction: true
          });

          localStorage.setItem(notificationKey, 'true');
        }
      });
    };

    // Check alle 30 Sekunden
    const interval = setInterval(checkCooldowns, 30000);
    checkCooldowns(); // Initial check

    return () => clearInterval(interval);
  }, [isPWA, notificationsEnabled, userData]);

  // Daily Bonus Reminder (jeden Tag um 12:00 Uhr)
  useEffect(() => {
    if (!isPWA || !notificationsEnabled) return;

    const checkDailyBonus = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Täglich um 12:00 Uhr
      if (hours === 12 && minutes === 0) {
        const lastReminder = localStorage.getItem('hhrp_daily_reminder');
        const today = now.toDateString();

        if (lastReminder !== today) {
          sendNotification({
            title: '🎁 Daily Bonus verfügbar!',
            body: 'Vergiss nicht deinen täglichen Bonus abzuholen!',
            icon: '/icon-512.png',
            tag: 'daily_bonus',
            url: '/profil'
          });

          localStorage.setItem('hhrp_daily_reminder', today);
        }
      }
    };

    // Check jede Minute
    const interval = setInterval(checkDailyBonus, 60000);
    checkDailyBonus(); // Initial check

    return () => clearInterval(interval);
  }, [isPWA, notificationsEnabled]);

  // Notification-Funktion
  const sendNotification = (options) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    // Verwende Service Worker für Notifications
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/icon-512.png',
          badge: '/icon-192.png',
          vibrate: [200, 100, 200],
          tag: options.tag || 'default',
          requireInteraction: options.requireInteraction || false,
          data: {
            url: options.url || '/profil',
            timestamp: Date.now()
          }
        });
      });
    } else {
      // Fallback: Browser Notification
      new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-512.png',
        tag: options.tag || 'default'
      });
    }
  };

  // Permission anfordern und Backend-Subscription erstellen
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Benachrichtigungen werden von deinem Browser nicht unterstützt');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      toast.error('Service Worker wird nicht unterstützt');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // Registriere Service Worker und erstelle Push-Subscription
        const registration = await navigator.serviceWorker.ready;
        
        // VAPID Public Key (muss generiert werden)
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
        
        // Konvertiere VAPID Key
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        
        // Erstelle Push-Subscription
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        // Sende Subscription an Backend
        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            userId: userData?.user_id || 'unknown'
          })
        });

        if (response.ok) {
          setNotificationsEnabled(true);
          toast.success('Benachrichtigungen aktiviert! 🔔');
          toast.info('Du erhältst jetzt Benachrichtigungen, auch wenn die App geschlossen ist!');
        } else {
          throw new Error('Backend error');
        }
      } else {
        toast.error('Benachrichtigungen wurden abgelehnt');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Fehler beim Aktivieren der Benachrichtigungen');
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
    <div className="flex items-center gap-3">
      {notificationsEnabled ? (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400 font-medium">Benachrichtigungen aktiv</span>
        </div>
      ) : permission === 'denied' ? (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <BellOff className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400 font-medium">Benachrichtigungen blockiert</span>
        </div>
      ) : (
        <button
          onClick={requestPermission}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
        >
          <Bell className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-400 font-medium">Benachrichtigungen aktivieren</span>
        </button>
      )}
    </div>
  );
}
