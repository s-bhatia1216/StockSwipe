// Minimal SW — just enough to make the app installable.
// No caching: every request goes straight to the network.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => self.clients.claim())
