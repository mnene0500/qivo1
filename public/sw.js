/**
 * QIVO Service Worker v1.0
 * Handles background push notifications for messages and calls.
 */

self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'You have a new notification on QIVO.',
        icon: '/icon-192.png',
        badge: '/notification.png',
        vibrate: [200, 100, 200],
        data: {
          url: data.url || '/'
        },
        actions: [
          { action: 'open', title: 'Open QIVO' }
        ]
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'QIVO Social', options)
      );
    } catch (e) {
      console.error('Push data parse error:', e);
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
