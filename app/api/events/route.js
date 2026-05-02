/**
 * Server-Sent Events (SSE) Endpoint für Echtzeit-Updates
 *
 * Kanal: GET /api/events
 *
 * Clients verbinden sich via new EventSource('/api/events') und bekommen
 * jeden Event, der via lib/realtime-bus emitEvent(...) gepusht wird.
 *
 * Events werden pro Typ gesendet:
 *   event: <type>
 *   data:  <json payload>
 *
 * Außerdem senden wir alle 25s eine Keep-Alive Zeile, damit die Verbindung
 * nicht von Proxies gekillt wird.
 */

import { subscribe } from '@/lib/realtime-bus';
import crypto from 'crypto';

// ACHTUNG: Next.js braucht das, damit SSE nicht gecached/statisch wird.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const JWT_SECRET = process.env.JWT_SECRET || 'hhrp-default-secret';

function verifyTokenSafe(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function getContext(request) {
  const authCookie = request.cookies.get('auth_token')?.value;
  const adminCookie = request.cookies.get('admin_token')?.value;
  const user = authCookie ? verifyTokenSafe(authCookie) : null;
  const admin = adminCookie ? verifyTokenSafe(adminCookie) : null;
  return { user, admin };
}

/**
 * Entscheidet, ob ein Event an diesen Client geschickt werden darf.
 *   scope = 'public'     → jeder bekommt es
 *   scope = 'admin'      → nur eingeloggte Admins
 *   scope = 'user:<id>'  → nur der spezifische User
 */
function eventAllowed(event, ctx) {
  if (!event.scope || event.scope === 'public') return true;
  if (event.scope === 'admin') return !!ctx.admin;
  if (event.scope.startsWith('user:')) {
    const targetId = event.scope.slice(5);
    return ctx.user?.id === targetId || !!ctx.admin;
  }
  return false;
}

export async function GET(request) {
  const ctx = getContext(request);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const safeSend = (chunk) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch (e) {
          closed = true;
        }
      };

      // Initialer Hello
      safeSend(
        `event: connected\ndata: ${JSON.stringify({
          ts: Date.now(),
          role: ctx.admin ? 'admin' : ctx.user ? 'user' : 'public',
        })}\n\n`
      );

      // Keep-Alive Ping alle 25s
      const keepAlive = setInterval(() => {
        safeSend(`: ping ${Date.now()}\n\n`);
      }, 25000);

      // Event-Subscriber
      const unsubscribe = subscribe((event) => {
        if (!eventAllowed(event, ctx)) return;
        safeSend(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      });

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(keepAlive);
        unsubscribe();
        try {
          controller.close();
        } catch (e) {
          // ignore
        }
      };

      // Abbruch durch Client
      if (request.signal) {
        if (request.signal.aborted) {
          cleanup();
        } else {
          request.signal.addEventListener('abort', cleanup);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Pragma': 'no-cache',
    },
  });
}
