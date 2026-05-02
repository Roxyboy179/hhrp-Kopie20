'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * useRealtime – React-Hook für Server-Sent Events vom HHRP Backend.
 *
 * Usage:
 *   const { connected } = useRealtime({
 *     'bewerbung.created': (evt) => refetch(),
 *     'bewerbung.updated': (evt) => refetch(),
 *   });
 *
 * Der Hook:
 *   - öffnet beim Mount eine SSE-Verbindung zu /api/events
 *   - hängt für jeden Event-Typ im handlers-Objekt einen Listener dran
 *   - verbindet sich automatisch nach Verbindungsabbruch (exponentielles Backoff)
 *   - liefert { connected } zurück für Live-Indicator
 */

const EVENT_TYPES = [
  'connected',
  'bewerbung.created',
  'bewerbung.updated',
  'bewerbung.deleted',
  'account.created',
  'account.updated',
  'account.deleted',
  'warning.created',
  'warning.updated',
  'warning.deleted',
  'settings.updated',
  'system.status.updated',
  'log.created',
  'user.updated',
  'user.notification',
];

export function useRealtime(handlers = {}) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let eventSource = null;
    let reconnectTimer = null;
    let closed = false;
    let attempt = 0;

    const connect = () => {
      if (closed) return;
      try {
        eventSource = new EventSource('/api/events', { withCredentials: true });
      } catch (e) {
        scheduleReconnect();
        return;
      }

      eventSource.addEventListener('connected', (ev) => {
        attempt = 0;
        setConnected(true);
        try {
          const data = JSON.parse(ev.data);
          handlersRef.current['connected']?.(data);
        } catch {}
      });

      // Alle relevanten Event-Typen registrieren
      const allTypes = new Set([
        ...EVENT_TYPES,
        ...Object.keys(handlersRef.current || {}),
      ]);

      for (const type of allTypes) {
        eventSource.addEventListener(type, (ev) => {
          try {
            const data = JSON.parse(ev.data);
            setLastEvent({ type, data, ts: Date.now() });
            const h = handlersRef.current[type];
            if (typeof h === 'function') h(data);
            // Wildcard-Handler
            const wildcard = handlersRef.current['*'];
            if (typeof wildcard === 'function') wildcard({ type, data });
          } catch (e) {
            // ignore parse errors
          }
        });
      }

      eventSource.onerror = () => {
        setConnected(false);
        if (eventSource) {
          try { eventSource.close(); } catch {}
        }
        scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (closed) return;
      attempt = Math.min(attempt + 1, 6);
      const delay = Math.min(1000 * 2 ** (attempt - 1), 15000); // 1s, 2s, 4s ... max 15s
      reconnectTimer = setTimeout(connect, delay);
    };

    connect();

    return () => {
      closed = true;
      setConnected(false);
      if (eventSource) {
        try { eventSource.close(); } catch {}
      }
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { connected, lastEvent };
}

export default useRealtime;
