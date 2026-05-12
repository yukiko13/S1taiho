self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("message", (e) => {
  if (e.data?.type === "NOTIFY") {
    self.registration.showNotification(e.data.title, {
      body: e.data.body,
      icon: e.data.icon || "/morning.png",
      badge: e.data.icon || "/morning.png",
      tag: e.data.tag || "sltaiho",
      renotify: true,
    });
  }
});
