import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { emitEvent } from './realtime-bus';

const NOTIFICATIONS_DIR = path.join(process.cwd(), 'data', 'notifications');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function createNotification({ userId, type, title, message, data = {} }) {
  const userDir = path.join(NOTIFICATIONS_DIR, userId);
  ensureDir(userDir);

  const id = crypto.randomUUID();
  const notification = {
    id,
    userId,
    type,
    title,
    message,
    isRead: false,
    data,
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(path.join(userDir, `${id}.json`), JSON.stringify(notification, null, 2));

  // Realtime → nur an diesen User pushen
  try {
    emitEvent({
      type: 'user.notification',
      scope: `user:${userId}`,
      data: {
        id,
        type,
        title,
        message,
        isRead: false,
        createdAt: notification.createdAt,
      },
    });
  } catch (e) { /* noop */ }

  return notification;
}

export async function getUserNotifications(userId, { limit = 50, unreadOnly = false } = {}) {
  const userDir = path.join(NOTIFICATIONS_DIR, userId);
  if (!fs.existsSync(userDir)) return [];

  const files = fs.readdirSync(userDir).filter(f => f.endsWith('.json'));
  let notifications = files.map(f => {
    try {
      return JSON.parse(fs.readFileSync(path.join(userDir, f), 'utf-8'));
    } catch {
      return null;
    }
  }).filter(Boolean);

  if (unreadOnly) {
    notifications = notifications.filter(n => !n.isRead);
  }

  // Sort by createdAt descending
  notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return notifications.slice(0, limit);
}

export async function getUnreadCount(userId) {
  const notifications = await getUserNotifications(userId, { unreadOnly: true });
  return notifications.length;
}

export async function markNotificationAsRead(userId, notificationId) {
  const filePath = path.join(NOTIFICATIONS_DIR, userId, `${notificationId}.json`);
  if (!fs.existsSync(filePath)) return null;

  const notification = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  notification.isRead = true;
  notification.readAt = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(notification, null, 2));
  return notification;
}

export async function markAllNotificationsAsRead(userId) {
  const userDir = path.join(NOTIFICATIONS_DIR, userId);
  if (!fs.existsSync(userDir)) return 0;

  const files = fs.readdirSync(userDir).filter(f => f.endsWith('.json'));
  let count = 0;

  for (const f of files) {
    try {
      const filePath = path.join(userDir, f);
      const notification = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (!notification.isRead) {
        notification.isRead = true;
        notification.readAt = new Date().toISOString();
        fs.writeFileSync(filePath, JSON.stringify(notification, null, 2));
        count++;
      }
    } catch {
      // skip broken files
    }
  }

  return count;
}

export async function deleteNotification(userId, notificationId) {
  const filePath = path.join(NOTIFICATIONS_DIR, userId, `${notificationId}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}
