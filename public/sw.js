
// Service Worker for FocusGuard
// Provides offline functionality and caching

const CACHE_NAME = 'focusguard-v2.1';
const STATIC_CACHE = 'focusguard-static-v2.1';

// Resources to cache for offline use
const CACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/assets/main-1z8lRo50.js', // This will be updated automatically by Vite
  '/manifest.json'
];

// Install event - cache essential resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static resources...');
        return cache.addAll(CACHE_URLS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => {
        console.log('Static resources cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(error => {
        console.error('Failed to cache resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName !== STATIC_CACHE && 
              cacheName !== CACHE_NAME &&
              (cacheName.startsWith('focusguard-') || cacheName.startsWith('workbox-'))
            )
            .map(cacheName => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('Service Worker activated successfully');
        return self.clients.claim(); // Take control of all pages
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle navigation requests (page loads)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html')
        .then(response => {
          if (response) {
            return response;
          }
          // Fallback to network if not in cache
          return fetch(request).catch(() => {
            // Return a basic offline page if fetch fails
            return new Response(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>FocusGuard - Offline</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { 
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      text-align: center; 
                      padding: 2rem; 
                      background: #f0f0f0;
                    }
                    .container { 
                      max-width: 400px; 
                      margin: 0 auto; 
                      padding: 2rem;
                      background: white;
                      border-radius: 8px;
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>🛡️ FocusGuard</h1>
                    <p>You're offline, but FocusGuard is ready to work!</p>
                    <p>Please refresh the page to continue with your cached app.</p>
                    <button onclick="window.location.reload()">🔄 Refresh App</button>
                  </div>
                </body>
              </html>
            `, {
              headers: { 'Content-Type': 'text/html' }
            });
          });
        })
    );
    return;
  }

  // Handle all other requests with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          // Return cached version
          return response;
        }
        
        // Try to fetch from network
        return fetch(request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cache successful responses for static assets
            if (url.pathname.includes('/assets/') || 
                url.pathname.endsWith('.js') || 
                url.pathname.endsWith('.css') ||
                url.pathname.endsWith('.svg') ||
                url.pathname.endsWith('.png')) {
              
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // Network failed, return offline indicator for assets
            if (request.destination === 'script' || request.destination === 'style') {
              return new Response('/* Offline - resource not available */', {
                headers: { 'Content-Type': 'text/plain' }
              });
            }
            
            // For other requests, return a basic error response
            return new Response(JSON.stringify({ 
              error: 'Offline', 
              message: 'This resource is not available offline' 
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
      })
  );
});

// Handle service worker updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Received SKIP_WAITING message');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Background sync for when connectivity returns
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Notify all clients that connection is restored
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'CONNECTION_RESTORED',
            timestamp: Date.now()
          });
        });
      })
    );
  }
});

console.log('Service Worker script loaded successfully');
