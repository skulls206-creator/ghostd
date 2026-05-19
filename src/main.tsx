import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if ("serviceWorker" in navigator) {
  // When a new SW takes control of this page, reload immediately so fresh
  // files replace any stale cached version (handles the old instaghost→ghostd
  // cache-bust automatically for all users).
  //
  // NOTE: `reloading` is module-scoped (per page load). On reload, the entire
  // JS context resets, so `reloading` starts fresh at `false` every time.
  // This prevents duplicate reloads from rapid `controllerchange` events.
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!reloading) {
      reloading = true;
      window.location.reload();
    }
  });

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

      // If a new SW is already waiting (installed but not yet active),
      // tell it to skip waiting immediately rather than waiting for all tabs to close.
      const skipWaiting = (worker: ServiceWorker) => {
        worker.postMessage({ type: "SKIP_WAITING" });
      };

      if (reg.waiting) {
        skipWaiting(reg.waiting);
      }

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New SW installed and ready — push it to activate immediately
            skipWaiting(newWorker);
          }
        });
      });

      // Periodic background sync for market data refresh
      // NOTE: Use proper feature detection — `"periodicSync" in reg` is unreliable
      // because it's a prototype property of ServiceWorkerRegistration.
      // Wrap in try/catch to handle unsupported browsers gracefully.
      if ("periodicSync" in ServiceWorkerRegistration.prototype) {
        try {
          const status = await navigator.permissions.query({
            name: "periodic-background-sync" as PermissionName,
          });
          if (status.state === "granted") {
            await (reg as any).periodicSync.register("refresh-market-data", {
              minInterval: 15 * 60 * 1000,
            });
          }
        } catch {
          // periodicSync not supported
        }
      }

      if ("PushManager" in window) {
        reg.pushManager.getSubscription().catch(() => {});
      }
    } catch {
      // SW registration failed silently
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
