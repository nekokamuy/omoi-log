const CACHE='omoi-v10';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./style.css','./hierarchy.css','./theme.css','./palette.css','./theme.js','./app.js','./core.js','./record-ui.js','./icon.svg','./icon-light.svg','./manifest.webmanifest'])));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)))});
