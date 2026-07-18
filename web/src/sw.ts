/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// PWA: Omogućava Service Workeru da odmah preuzme kontrolu nad klijentima
self.skipWaiting();
clientsClaim();

// PWA: Precache svega što Vite build izgeneriše
precacheAndRoute(self.__WB_MANIFEST || []);

// WEB PUSH: Listener za primanje "push" događaja sa servera
self.addEventListener('push', (event) => {
  let data = { title: 'Nova poruka', body: 'Imate novo obaveštenje', url: '/' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200, 100, 200, 100, 200], // Premium vibracija za telefone
    data: { url: data.url }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// WEB PUSH: Šta se dešava kada korisnik klikne na notifikaciju
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Ako je aplikacija već otvorena, fokusiraj je
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // U suprotnom otvori novi prozor/tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
