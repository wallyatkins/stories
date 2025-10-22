self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  let payload = {};
  try {
    payload = event.data.json();
  } catch (err) {
    payload = { title: 'Story Prompts', body: event.data.text() };
  }
  const title = payload.title || 'Story Prompts';
  const options = {
    body: payload.body || 'You have an update.',
    tag: payload.tag,
    data: {
      url: payload.url || '/',
    },
    vibrate: [100, 50, 100],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const client = clientList.find((client) => client.url.includes(self.location.origin));
      if (client) {
        client.focus();
        if ('navigate' in client) {
          client.navigate(url);
        }
        return;
      }
      self.clients.openWindow(url);
    })
  );
});
