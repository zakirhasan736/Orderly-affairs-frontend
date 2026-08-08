/* Orderly Affairs Web Push service worker */
/* global self, clients */

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  let payload = {
    title: 'Orderly Affairs',
    body: 'You have a vault reminder.',
    url: '/',
    tag: 'orderly-reminder',
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    }
  } catch {
    try {
      const text = event.data && event.data.text();
      if (text) payload.body = text;
    } catch {
      /* ignore */
    }
  }

  const title = payload.title || 'Orderly Affairs';
  const targetUrl = payload.url || '/';
  const options = {
    body: payload.body || '',
    tag: payload.tag || 'orderly-reminder',
    renotify: true,
    data: {
      url: targetUrl,
    },
    icon: '/images/brand-mark-light.svg',
    badge: '/images/brand-mark-light.svg',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            try {
              await client.navigate(targetUrl);
            } catch {
              /* ignore */
            }
          }
          return;
        }
      }
      if (clients.openWindow) {
        await clients.openWindow(targetUrl);
      }
    })(),
  );
});
