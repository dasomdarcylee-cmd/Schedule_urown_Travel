// 설치 가능(installable) PWA를 위한 최소 서비스워커. fetch 가로채기는 하지 않는다
// (Next의 자체 캐싱과 충돌하지 않도록 일부러 비워둔다).
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
