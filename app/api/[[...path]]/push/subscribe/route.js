import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Web Push Konfiguration
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:admin@hhrp.de',
    vapidPublicKey,
    vapidPrivateKey
  );
}

// POST - Subscription speichern
export async function POST(request) {
  try {
    const { subscription, userId } = await request.json();

    if (!subscription || !userId) {
      return NextResponse.json(
        { error: 'Subscription und userId erforderlich' },
        { status: 400 }
      );
    }

    // Speichere Subscription in Supabase
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        subscription: subscription,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('[Push API] Error saving subscription:', error);
      return NextResponse.json(
        { error: 'Fehler beim Speichern der Subscription' },
        { status: 500 }
      );
    }

    // Sende Test-Benachrichtigung
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: '🔔 Benachrichtigungen aktiviert!',
          body: 'Du erhältst jetzt Push-Benachrichtigungen, auch wenn die App geschlossen ist!',
          icon: '/icon-512.png',
          badge: '/icon-192.png',
          tag: 'test',
          url: '/profil'
        })
      );
    } catch (pushError) {
      console.error('[Push API] Error sending test notification:', pushError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Push API] Error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// DELETE - Subscription löschen
export async function DELETE(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId erforderlich' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[Push API] Error deleting subscription:', error);
      return NextResponse.json(
        { error: 'Fehler beim Löschen der Subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Push API] Error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
