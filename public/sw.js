/**
 * QIVO Service Worker for Web Push Notifications.
 * Listens for 'push' events and displays system alerts.
 */

self.addEventListener('push', function(event) {
  if (event.data) {
    const payload = event.data.json();
    
    const options = {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/notification.png',
      vibrate: [100, 50, 100],
      data: {
        url: payload.url || '/'
      },
      actions: [
        { action: 'open', title: 'View' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(payload.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus().then(() => client.navigate(urlToOpen));
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
