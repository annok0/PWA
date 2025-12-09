import { precacheAndRoute } from 'workbox-precaching';
import { BackgroundSyncQueue } from 'workbox-background-sync';

// ===============================================
// 1. Service Worker & Cache API (via Workbox)
// ===============================================
// Precache: Captura os arquivos gerados no build (JS, CSS, HTML)
precacheAndRoute(self.__WB_MANIFEST || []);

// ===============================================
// 2. Background Sync
// ===============================================
// Cria fila para requisições falhas (ex: usuário offline)
const bgSyncQueue = new BackgroundSyncQueue('postQueue');

self.addEventListener('fetch', (event) => {
  // Intercepta apenas POSTs para a nossa API fictícia
  if (event.request.method === 'POST' && event.request.url.includes('/api/sync-data')) {
    const clonedRequest = event.request.clone();
    
    event.respondWith(async () => {
      try {
        // Tenta fazer a requisição normal (Online)
        const response = await fetch(clonedRequest);
        return response; 
      } catch (error) {
        // Se falhar (Offline), joga na fila do Background Sync
        await bgSyncQueue.pushRequest({ request: clonedRequest });
        console.log('⚠️ Offline: Requisição salva para envio posterior.');
        
        // Retorna "sucesso temporário" para o Frontend não quebrar
        return new Response(JSON.stringify({ 
            status: 'queued', 
            message: 'Dados salvos. Serão enviados quando houver internet.' 
        }), { 
            status: 202, 
            headers: { 'Content-Type': 'application/json' }
        });
      }
    })();
  }
});

// ===============================================
// 3. Push Notification
// ===============================================
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  
  const title = data.title || 'Notificação PWA';
  const options = {
    body: data.body || 'Você recebeu um aviso em segundo plano.',
    icon: '/pwa-192x192.png', // Certifique-se de ter este ícone na pasta public
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data.url;

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});