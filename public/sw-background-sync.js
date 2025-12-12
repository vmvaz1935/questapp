/**
 * Service Worker - Background Sync Handler
 * Processa fila de sincronização quando o dispositivo volta online
 */

const CACHE_NAME = 'fisioq-v1';
const SYNC_QUEUE_KEY = 'fisioq_sync_queue';

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting(); // Ativar imediatamente
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Handler para Background Sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'fisioq-sync') {
    event.waitUntil(processSyncQueue());
  }
});

// Handler para quando o dispositivo volta online
self.addEventListener('online', () => {
  console.log('[SW] Device is online, processing sync queue...');
  processSyncQueue();
});

/**
 * Processa fila de sincronização
 */
async function processSyncQueue() {
  try {
    // Obter fila do IndexedDB via postMessage
    const clients = await self.clients.matchAll();
    
    // Solicitar fila ao cliente principal
    if (clients.length > 0) {
      clients[0].postMessage({ type: 'GET_SYNC_QUEUE' });
    }

    // Nota: Em uma implementação completa, o Service Worker teria acesso direto ao IndexedDB
    // ou usaria postMessage para comunicar com o cliente principal
    // Por enquanto, delegamos ao cliente principal processar a fila
    
    console.log('[SW] Sync queue processing initiated');
  } catch (error) {
    console.error('[SW] Error processing sync queue:', error);
  }
}

// Handler para mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'PROCESS_SYNC_QUEUE') {
    // Cliente principal processará a fila e notificará o SW
    event.ports[0].postMessage({ success: true });
  }
});

// Handler para notificações push (opcional, para futuras implementações)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'fisioq-sync',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification('FisioQ', options)
  );
});

// Handler para clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

