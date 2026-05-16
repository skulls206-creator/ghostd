import { useState, useCallback } from "react";
import { toast } from "sonner";

const ASKED_KEY = "ghostd_notif_asked";

function getPermission(): NotificationPermission {
  try { return Notification.permission; } catch { return "denied"; }
}

function hasBeenAsked(): boolean {
  try { return localStorage.getItem(ASKED_KEY) === "yes"; } catch { return false; }
}

function markAsked() {
  try { localStorage.setItem(ASKED_KEY, "yes"); } catch {}
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(getPermission);

  const canNotify = permission === "granted";

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof Notification === "undefined") return false;
    if (permission === "granted") return true;
    if (permission === "denied") return false;
    markAsked();
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, [permission]);

  // Prompt the user via a Sonner toast with action buttons (only once)
  const promptIfNeeded = useCallback((context: "alert" | "order") => {
    if (typeof Notification === "undefined") return;
    if (permission === "granted" || permission === "denied") return;
    if (hasBeenAsked()) return;
    markAsked();

    const label = context === "alert"
      ? "Get browser notifications when your price alerts trigger?"
      : "Get browser notifications when your orders fill?";

    toast(label, {
      duration: 12000,
      position: "top-right",
      action: {
        label: "Enable",
        onClick: async () => {
          const result = await Notification.requestPermission();
          setPermission(result);
          if (result === "granted") {
            toast.success("Notifications enabled! You'll be notified even if the tab is in the background.", { duration: 4000 });
          }
        },
      },
      cancel: { label: "Not now", onClick: () => {} },
    });
  }, [permission]);

  const notify = useCallback((title: string, body: string) => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try {
      new Notification(title, { body, icon: "/icon-192.png", badge: "/icon-192.png" });
    } catch {}
  }, []);

  return { permission, canNotify, requestPermission, promptIfNeeded, notify };
}
