const CACHE_NAME = 'hanja-memo-v21';
const SHELL = [
  './',
  './index.html',
  './japanese.html',
  './japanese-study.html',
  './japanese-groups.js',
  './exam-select.html',
  './exam-select.js',
  './exam.html',
  './styles.css',
  './app.js',
  './exam.js',
  './exam-history.js',
  './adfit.js',
  './exam-ad-gate.js',
  './config.js',
  './sheets.js',
  './exams/catalog.json',
  './exams/27-1/exam-data.json',
  './exams/27-1/exam-answers.json',
  './exams/24-1/exam-data.json',
  './exams/24-1/exam-answers.json',
  './exams/25-1/exam-data.json',
  './exams/25-1/exam-answers.json',
  './exams/26-1/exam-data.json',
  './exams/26-1/exam-answers.json',
  './exams/27-2-kyungho/exam-data.json',
  './exams/27-2-kyungho/exam-answers.json',
  './exams/26-2-kyungho/exam-data.json',
  './exams/26-2-kyungho/exam-answers.json',
  './manifest.json',
  './ads.txt',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (
    url.hostname.includes('google.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('kakaocdn.net') ||
    url.hostname.includes('daumcdn.net')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && event.request.method === 'GET' && url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    }).catch(() => caches.match('./index.html'))
  );
});
