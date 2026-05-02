/**
 * Realtime Event Bus (Server-Side)
 * 
 * Singleton Pub/Sub für Server-Sent Events. Wir nutzen globalThis damit der
 * Bus über Next.js Hot-Module-Reloads und mehrere Imports hinweg derselbe
 * bleibt. Alle Subscriber sind einfache Callback-Funktionen.
 */

function getBus() {
  if (!globalThis.__HHRP_REALTIME_BUS__) {
    globalThis.__HHRP_REALTIME_BUS__ = {
      subscribers: new Set(),
      counter: 0,
    };
  }
  return globalThis.__HHRP_REALTIME_BUS__;
}

/**
 * Callback registrieren. Gibt eine unsubscribe() Funktion zurück.
 */
export function subscribe(callback) {
  const bus = getBus();
  bus.subscribers.add(callback);
  return () => {
    bus.subscribers.delete(callback);
  };
}

/**
 * Event an alle verbundenen Clients pushen.
 * event = { type, data?, scope? }
 *   - type: "bewerbung.created" | "bewerbung.updated" | ...
 *   - data: beliebige Nutzlast (bleibt klein halten!)
 *   - scope: optional "admin" | "user:<discordId>" | "public" (default: "public")
 */
export function emitEvent(event) {
  const bus = getBus();
  bus.counter += 1;
  const payload = {
    id: bus.counter,
    type: event.type,
    scope: event.scope || 'public',
    data: event.data || null,
    ts: Date.now(),
  };
  for (const sub of bus.subscribers) {
    try {
      sub(payload);
    } catch (e) {
      // Ignorieren – toter Subscriber wird beim nächsten Tick entfernt
    }
  }
  return payload;
}

export function getSubscriberCount() {
  return getBus().subscribers.size;
}

/**
 * Convenience: gängige Event-Helfer, damit wir überall im Code dieselben
 * Event-Typen verwenden.
 */
export const RT = {
  // Bewerbungen
  bewerbungCreated: (data) => emitEvent({ type: 'bewerbung.created', data, scope: 'admin' }),
  bewerbungUpdated: (data) => emitEvent({ type: 'bewerbung.updated', data, scope: 'public' }),
  bewerbungDeleted: (data) => emitEvent({ type: 'bewerbung.deleted', data, scope: 'public' }),

  // Admin Accounts
  accountCreated: (data) => emitEvent({ type: 'account.created', data, scope: 'admin' }),
  accountUpdated: (data) => emitEvent({ type: 'account.updated', data, scope: 'admin' }),
  accountDeleted: (data) => emitEvent({ type: 'account.deleted', data, scope: 'admin' }),

  // Verwarnungen
  warningCreated: (data) => emitEvent({ type: 'warning.created', data, scope: 'public' }),
  warningUpdated: (data) => emitEvent({ type: 'warning.updated', data, scope: 'public' }),
  warningDeleted: (data) => emitEvent({ type: 'warning.deleted', data, scope: 'public' }),

  // Settings & System
  settingsUpdated: (data) => emitEvent({ type: 'settings.updated', data, scope: 'admin' }),
  systemStatusUpdated: (data) => emitEvent({ type: 'system.status.updated', data, scope: 'public' }),

  // Activity Logs
  logCreated: (data) => emitEvent({ type: 'log.created', data, scope: 'admin' }),

  // User Profil
  userUpdated: (data) => emitEvent({ type: 'user.updated', data, scope: 'public' }),
  userNotification: (data) => emitEvent({ type: 'user.notification', data, scope: 'public' }),
};
