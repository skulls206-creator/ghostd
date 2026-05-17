const CACHE_NAME = "ghostd-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/logo.png",
  "/icon-192.png",
  "/icon-512.png",
];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

// ─── Fetch (offline support + caching strategy) ───────────────────────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Pass-through for non-GET and cross-origin
  if (event.request.method !== "GET") return;
  if (url.origin !== self.location.origin && !url.hostname.includes("crp.is"))
    return;

  // API calls: network-only (never serve stale trading data)
  if (url.pathname.startsWith("/api/") || url.hostname.includes("crp.is")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(
          JSON.stringify({ error: "offline", message: "No network connection" }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    return;
  }

  // Navigation (HTML): network-first, fall back to cached shell
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return res;
        })
        .catch(async () => {
            const fallback = (await caches.match("/")) || (await caches.match(event.request));
            return fallback || new Response(
              "<!doctype html><meta charset=utf-8><title>Offline</title><body style=\"background:#0b0b0f;color:#06B6D4;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0\">Offline — reconnect to load GHOSTD.</body>",
              { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
            );
          })
    );
    return;
  }

  // Static assets: cache-first, update in background
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return res;
      }).catch(() => cached || Response.error());
      return cached || networkFetch;
    })
  );
});

// ─── Background Sync (queued orders when offline) ────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-orders") {
    event.waitUntil(flushOrderQueue());
  }
  if (event.tag === "sync-price-alerts") {
    event.waitUntil(checkPriceAlerts());
  }
});

async function flushOrderQueue() {
  try {
    const db = await openDB();
    const tx = db.transaction("pending_orders", "readwrite");
    const store = tx.objectStore("pending_orders");
    const orders = await getAllFromStore(store);

    for (const order of orders) {
      try {
        const res = await fetch(order.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order.body),
          credentials: "include",
        });
        if (res.ok) {
          const delTx = db.transaction("pending_orders", "readwrite");
          delTx.objectStore("pending_orders").delete(order.id);
        }
      } catch {
        // Keep in queue, retry on next sync
      }
    }
  } catch {
    // IndexedDB not available
  }
}

async function checkPriceAlerts() {
  try {
    const db = await openDB();
    const tx = db.transaction("price_alerts", "readonly");
    const store = tx.objectStore("price_alerts");
    const alerts = await getAllFromStore(store);

    for (const alert of alerts) {
      try {
        const res = await fetch(`/api/market/ticker?pair=${alert.pair}`);
        const data = await res.json();
        const price = parseFloat(data.last);
        const triggered =
          (alert.direction === "above" && price >= alert.target) ||
          (alert.direction === "below" && price <= alert.target);

        if (triggered) {
          await self.registration.showNotification("GHOSTD Price Alert", {
            body: `${alert.pair} is ${alert.direction} ${alert.target} — now at ${price}`,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: `alert-${alert.id}`,
            data: { url: `/trade?pair=${alert.pair}` },
          });
          const delTx = db.transaction("price_alerts", "readwrite");
          delTx.objectStore("price_alerts").delete(alert.id);
        }
      } catch {
        // Skip this alert on error
      }
    }
  } catch {
    // IndexedDB not available
  }
}

// ─── Periodic Background Sync ─────────────────────────────────────────────────
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "refresh-market-data") {
    event.waitUntil(prefetchMarketData());
  }
});

async function prefetchMarketData() {
  try {
    const pairs = ["CRP/USDT", "BTC/USDT", "XMR/USDT"];
    const cache = await caches.open(CACHE_NAME + "-market");
    await Promise.allSettled(
      pairs.map((pair) =>
        fetch(`/api/market/ticker?pair=${encodeURIComponent(pair)}`)
          .then((res) => {
            if (res.ok) cache.put(`/api/market/ticker?pair=${encodeURIComponent(pair)}`, res);
          })
          .catch(() => {})
      )
    );
  } catch {
    // Silently fail
  }
}

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let payload = { title: "GHOSTD", body: "You have a new notification.", url: "/" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    if (event.data) payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: payload.tag || "ghostd-push",
      data: { url: payload.url },
      actions: payload.actions || [],
      vibrate: [200, 100, 200],
    })
  );
});

// ─── Notification Click ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(self.location.origin));
        if (existing) {
          existing.focus();
          return existing.navigate(targetUrl);
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});

// ─── Message handler (skip waiting on demand) ────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ─── IndexedDB helpers ────────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("ghostd-sw", 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("pending_orders")) {
        db.createObjectStore("pending_orders", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("price_alerts")) {
        db.createObjectStore("price_alerts", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
