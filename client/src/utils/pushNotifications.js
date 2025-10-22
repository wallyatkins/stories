const PUBLIC_CONFIG_ENDPOINT = '/api/push_config.php';
const SUBSCRIBE_ENDPOINT = '/api/push_subscribe.php';
const UNSUBSCRIBE_ENDPOINT = '/api/push_unsubscribe.php';

async function fetchPushConfig() {
  const res = await fetch(PUBLIC_CONFIG_ENDPOINT, { headers: { 'Cache-Control': 'no-store' } });
  if (!res.ok) {
    throw new Error('Failed to load push configuration');
  }
  return res.json();
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function ensureServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return null;
  }
  const registration = await navigator.serviceWorker.register('/service-worker.js');
  return registration;
}

export async function getExistingSubscription() {
  if (!('serviceWorker' in navigator)) {
    return null;
  }
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush() {
  if (!('Notification' in window) || Notification.permission === 'denied') {
    throw new Error('Notifications are blocked by the browser');
  }

  const registration = await ensureServiceWorker();
  if (!registration) {
    throw new Error('Service workers are not supported');
  }

  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    return existing;
  }

  const config = await fetchPushConfig();
  if (!config.enabled) {
    throw new Error('Notifications are not enabled on the server');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permission not granted');
  }

 const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey),
  });

  const res = await fetch(SUBSCRIBE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });
  if (!res.ok) {
    throw new Error('Server rejected push subscription');
  }
  return subscription;
}

export async function unsubscribeFromPush() {
  const subscription = await getExistingSubscription();
  if (!subscription) {
    return;
  }

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  const res = await fetch(UNSUBSCRIBE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  });
  if (!res.ok) {
    throw new Error('Failed to unregister push subscription');
  }
}

export async function isPushSupported() {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  const config = await fetchPushConfig().catch(() => ({ enabled: false }));
  return !!config.enabled;
}
