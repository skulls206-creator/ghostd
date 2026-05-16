import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

function sendNotification(title: string, body: string) {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try { new Notification(title, { body, icon: "/pwa-192x192.png" }); } catch {}
  }
}

const KEY = "ghostd_price_alerts";

export interface PriceAlert {
  id: string;
  pair: string;
  direction: "above" | "below";
  targetPrice: number;
  createdAt: number;
  triggered: boolean;
  triggeredAt?: number;
}

const CHANGE_EVENT = "ghostd-alerts-changed";

function load(): PriceAlert[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function persist(alerts: PriceAlert[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(alerts));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {}
}

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>(load);

  // Sync across multiple hook instances on the same page via custom event
  useEffect(() => {
    const handleChange = () => setAlerts(load());
    window.addEventListener(CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(CHANGE_EVENT, handleChange);
  }, []);

  const addAlert = useCallback((pair: string, direction: "above" | "below", targetPrice: number) => {
    const alert: PriceAlert = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      pair,
      direction,
      targetPrice,
      createdAt: Date.now(),
      triggered: false,
    };
    setAlerts(prev => {
      const next = [...prev, alert];
      persist(next);
      return next;
    });
    toast.success(`Alert set: ${pair.replace("_", "/").toUpperCase()} ${direction} ${targetPrice}`, { duration: 2500 });
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => {
      const next = prev.filter(a => a.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const clearTriggered = useCallback(() => {
    setAlerts(prev => {
      const next = prev.filter(a => !a.triggered);
      persist(next);
      return next;
    });
  }, []);

  // Check prices against active alerts
  const checkPrices = useCallback((prices: Record<string, number>) => {
    setAlerts(prev => {
      let changed = false;
      const next = prev.map(a => {
        if (a.triggered) return a;
        const price = prices[a.pair];
        if (price === undefined) return a;
        const hit = a.direction === "above" ? price >= a.targetPrice : price <= a.targetPrice;
        if (!hit) return a;
        changed = true;
        const pairLabel = a.pair.replace("_", "/").toUpperCase();
        const msg = `${pairLabel} is ${a.direction} ${a.targetPrice} (now ${price.toFixed(6)})`;
        toast.success(`🔔 Alert triggered! ${msg}`, { duration: 8000, position: "top-right" });
        sendNotification(`🔔 Price Alert: ${pairLabel}`, msg);
        return { ...a, triggered: true, triggeredAt: Date.now() };
      });
      if (changed) persist(next);
      return next;
    });
  }, []);

  const activeCount = alerts.filter(a => !a.triggered).length;

  return { alerts, addAlert, removeAlert, clearTriggered, checkPrices, activeCount };
}
