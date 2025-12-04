const CACHE_NAME = 'somafm-player-cache-v6'; // zmen v1 na v2 a vyssie, pri kazdom update
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js', // Corrected from script.js to app.js
  '/manifest.json',
  '/service-worker.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Don't cache streaming requests or playlist API calls
  if (event.request.url.includes('.m3u8') ||
      event.request.url.includes('somafm.com') ||
      event.request.url.includes('corsproxy.io')) {
    // Always fetch streaming requests from network
    return fetch(event.request);
  }
  
  // Use cache-first for static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
