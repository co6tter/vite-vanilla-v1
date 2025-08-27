// Service Worker for reminder persistence
const CACHE_NAME = 'diary-app-v1';
const urlsToCache = ['/', '/src/main.ts', '/src/style.css'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});

// Handle reminder notifications when app is closed
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_REMINDER') {
    const { time, enabled } = event.data.payload;

    if (enabled) {
      scheduleReminderNotification(time);
    }
  }
});

function scheduleReminderNotification(time) {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  const reminderDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0
  );

  if (reminderDate <= now) {
    reminderDate.setDate(reminderDate.getDate() + 1);
  }

  const timeUntilReminder = reminderDate.getTime() - now.getTime();

  setTimeout(() => {
    self.registration.showNotification('📝 日記の時間です', {
      body: '今日の出来事を振り返って日記を書きましょう！',
      icon: '/vite.svg',
      tag: 'diary-reminder',
      actions: [
        {
          action: 'write',
          title: '日記を書く',
        },
        {
          action: 'dismiss',
          title: '後で',
        },
      ],
    });

    // Schedule next reminder
    scheduleReminderNotification(time);
  }, timeUntilReminder);
}

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'write') {
    event.waitUntil(clients.openWindow('/'));
  }
});
