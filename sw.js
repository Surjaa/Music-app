// Mauj service worker: makes the app installable and usable offline.
const CACHE = 'mauj-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './samples/mauj_dhun.mp3',
  './samples/raat_ki_raag.mp3',
  './samples/mauj_ringtone_1.mp3',
  './samples/mauj_ringtone_2.mp3'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(handle(req));
});

async function handle(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req.url);
  if (!cached) {
    if (req.headers.has('range')) return fetch(req);
    const res = await fetch(req);
    if (res.ok && res.type === 'basic') cache.put(req.url, res.clone());
    return res;
  }
  // Audio/video seeking sends Range requests; answer them from the cached full file.
  if (req.headers.has('range')) return rangeResponse(req, cached);
  return cached;
}

async function rangeResponse(req, cached) {
  const buf = await cached.arrayBuffer();
  const size = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range')) || [];
  let start, end;
  if (m[1] === undefined || m[1] === '') {          // suffix range: last N bytes
    start = Math.max(0, size - Number(m[2]));
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  }
  const body = buf.slice(start, end + 1);
  return new Response(body, {
    status: 206,
    headers: {
      'Content-Type': cached.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(body.byteLength),
      'Accept-Ranges': 'bytes'
    }
  });
}
