/* 焼きそばレジ Service Worker
   アプリ本体は「キャッシュ優先＋裏で更新」。電波が弱くても即起動し、次回起動時に新しい版へ切り替わる。
   index.html などを更新したら VERSION を上げること。 */
const VERSION = "v6";
const APP = "yakisoba-app-" + VERSION;
const FONTS = "yakisoba-fonts";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== APP && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Google Fonts：一度取れたらずっとキャッシュを使う
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.open(FONTS).then(async c => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok || res.type === "opaque") c.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // アプリ本体：キャッシュを即返し、裏でネットから取り直す
  e.respondWith(
    caches.open(APP).then(async c => {
      const key = req.mode === "navigate" ? "./index.html" : req;
      const hit = await c.match(key, { ignoreSearch: req.mode === "navigate" });
      const net = fetch(req)
        .then(res => { if (res.ok) c.put(key, res.clone()); return res; })
        .catch(() => hit || Response.error());
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    })
  );
});
