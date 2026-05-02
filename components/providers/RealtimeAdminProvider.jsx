'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useRealtime } from '@/hooks/useRealtime';

/**
 * RealtimeAdminProvider – zentrale SSE-Verbindung fürs Admin-Panel.
 *
 * Stellt allen Admin-Seiten bereit:
 *   - connected: boolean (für Live-Indicator)
 *   - pendingBewerbungen: number (Badge-Counter)
 *   - onEvent(handler): Seite kann sich für "jedes" Event registrieren
 *
 * Die eigentlichen Daten-Refreshes passieren in den jeweiligen Seiten über
 * einen lokalen useRealtime({...}) Hook. Dieser Provider übernimmt nur die
 * übergreifenden Dinge: Verbindung, globale Toasts, Badge.
 */

const RealtimeAdminContext = createContext({
  connected: false,
  eventTick: 0,
});

export function RealtimeAdminProvider({ children, admin }) {
  const [eventTick, setEventTick] = useState(0);
  const [bewerbungFlash, setBewerbungFlash] = useState(0);

  const bumpTick = useCallback(() => setEventTick((t) => t + 1), []);

  const { connected } = useRealtime({
    'bewerbung.created': (evt) => {
      bumpTick();
      if (admin) {
        toast.success('Neue Bewerbung eingegangen', {
          description: `${evt.data?.username || 'Unbekannt'} hat eine ${
            evt.data?.bewerbungType === 'uprank'
              ? 'Uprank-'
              : evt.data?.bewerbungType === 'praktikum'
              ? 'Praktikum-'
              : ''
          }Bewerbung eingereicht.`,
        });
        setBewerbungFlash((f) => f + 1);
      }
    },
    'bewerbung.updated': (evt) => {
      bumpTick();
      if (admin && evt.data?.byAdmin && evt.data?.adminName !== admin.discordUsername) {
        toast.message(`Bewerbung ${evt.data?.status}`, {
          description: `Bearbeitet von ${evt.data?.adminName || 'Admin'}`,
        });
      }
    },
    'bewerbung.deleted': () => bumpTick(),
    'account.created': (evt) => {
      bumpTick();
      if (admin) {
        toast.success('Neuer Admin-Account erstellt', {
          description: `${evt.data?.discordUsername || evt.data?.mitarbeiterNummer}`,
        });
      }
    },
    'account.updated': () => bumpTick(),
    'account.deleted': () => {
      bumpTick();
      if (admin) toast.message('Admin-Account wurde gelöscht');
    },
    'settings.updated': () => bumpTick(),
    'system.status.updated': () => bumpTick(),
    'log.created': () => bumpTick(),
    'warning.created': () => bumpTick(),
    'warning.updated': () => bumpTick(),
    'warning.deleted': () => bumpTick(),
  });

  return (
    <RealtimeAdminContext.Provider value={{ connected, eventTick, bewerbungFlash }}>
      {children}
    </RealtimeAdminContext.Provider>
  );
}

export function useRealtimeAdmin() {
  return useContext(RealtimeAdminContext);
}

export default RealtimeAdminProvider;
