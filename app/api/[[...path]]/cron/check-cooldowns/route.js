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

// Dieser Endpoint wird von einem Cron-Job aufgerufen
export async function GET(request) {
  // Security: Prüfe Secret für Cron-Zugriff
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'default-secret-change-me';
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron] Starting cooldown check...');
    
    // Hole alle User-Daten mit Cooldowns
    const { data: users, error: usersError } = await supabase
      .from('user_data')
      .select('discord_user_id, data');

    if (usersError) {
      console.error('[Cron] Error fetching users:', usersError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Hole alle Push-Subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (subError) {
      console.error('[Cron] Error fetching subscriptions:', subError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const now = Date.now();
    let notificationsSent = 0;
    let errors = 0;

    // Prüfe jeden User
    for (const user of users) {
      const userId = user.discord_user_id;
      const userData = user.data;
      const cooldowns = userData.cooldowns || {};
      const licenses = userData.licenses || [];

      // Finde Subscription für diesen User
      const userSub = subscriptions.find(sub => sub.user_id === userId);
      if (!userSub) continue;

      // Prüfe jeden Cooldown
      for (const [cooldownKey, startTime] of Object.entries(cooldowns)) {
        // Berechne Cooldown-Dauer
        let duration = 4 * 60 * 60 * 1000; // 4h default (collect)
        
        if (cooldownKey === 'collect') {
          if (licenses.includes('vip_elite_plus') || licenses.includes('vip_ultimate')) {
            duration = 45 * 60 * 1000; // 45 Min
          } else if (licenses.includes('vip_platinum')) {
            duration = 1 * 60 * 60 * 1000; // 1h
          } else if (licenses.includes('vip_premium')) {
            duration = 2 * 60 * 60 * 1000; // 2h
          }
        } else if (cooldownKey === 'ueberfall') {
          duration = 24 * 60 * 60 * 1000; // 24h
        } else if (cooldownKey === 'elitePlusDaily') {
          duration = 24 * 60 * 60 * 1000; // 24h
        }

        const endTime = startTime + duration;
        const timeLeft = endTime - now;

        // Cooldown-Namen
        const cooldownNames = {
          collect: '💰 Gehalt abholen',
          ueberfall: '🔫 Überfall',
          elitePlusDaily: '⭐ Elite+ Daily',
          work: '💼 Arbeiten'
        };

        // Prüfe ob Benachrichtigung bereits gesendet wurde
        const notificationKey = `${userId}_${cooldownKey}_${startTime}`;
        
        // Benachrichtige wenn Cooldown jetzt verfügbar ist (innerhalb 2 Minuten)
        if (timeLeft <= 120000 && timeLeft > -60000) {
          try {
            // Prüfe ob bereits gesendet
            const { data: existing } = await supabase
              .from('sent_notifications')
              .select('id')
              .eq('notification_key', notificationKey)
              .single();

            if (!existing) {
              // Sende Push-Notification
              await webpush.sendNotification(
                userSub.subscription,
                JSON.stringify({
                  title: `✅ ${cooldownNames[cooldownKey] || cooldownKey} verfügbar!`,
                  body: 'Du kannst jetzt wieder den Command ausführen!',
                  icon: '/icon-512.png',
                  badge: '/icon-192.png',
                  tag: `cooldown_${cooldownKey}`,
                  url: '/profil',
                  requireInteraction: true
                })
              );

              // Markiere als gesendet
              await supabase
                .from('sent_notifications')
                .insert({
                  notification_key: notificationKey,
                  user_id: userId,
                  type: 'cooldown_ready',
                  sent_at: new Date().toISOString()
                });

              notificationsSent++;
              console.log(`[Cron] Sent notification to ${userId} for ${cooldownKey}`);
            }
          } catch (pushError) {
            console.error(`[Cron] Error sending notification to ${userId}:`, pushError);
            
            // Wenn Subscription ungültig ist, lösche sie
            if (pushError.statusCode === 410) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('user_id', userId);
              console.log(`[Cron] Removed invalid subscription for ${userId}`);
            }
            
            errors++;
          }
        }
      }
    }

    // Cleanup: Lösche alte Notification-Records (älter als 7 Tage)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('sent_notifications')
      .delete()
      .lt('sent_at', sevenDaysAgo);

    console.log(`[Cron] Completed: ${notificationsSent} notifications sent, ${errors} errors`);

    return NextResponse.json({
      success: true,
      notificationsSent,
      errors,
      usersChecked: users.length
    });

  } catch (error) {
    console.error('[Cron] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
