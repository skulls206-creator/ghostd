import { apiFetch } from "@/lib/apiFetch";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { formatCrypto } from "@/lib/utils";

function sendNotification(title: string, body: string) {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try { new Notification(title, { body, icon: "/pwa-192x192.png" }); } catch {}
  }
}

interface OpenOrder {
  orderId: number;
  amount: number;
  price: number;
  value: number;
  task: string;
  status: string;
  cur: string;
  ecur: string;
}

const POLL_INTERVAL = 15_000;

export function useOrderFillMonitor(isLoggedIn: boolean) {
  const knownOrdersRef = useRef<Map<number, OpenOrder> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    async function fetchOpenOrders(): Promise<OpenOrder[]> {
      try {
        const r = await apiFetch("/api/orders?status=open");
        if (!r.ok) return [];
        const data = await r.json();
        return data.orders ?? [];
      } catch {
        return [];
      }
    }

    async function poll() {
      const current = await fetchOpenOrders();
      const currentMap = new Map(current.map(o => [o.orderId, o]));

      if (knownOrdersRef.current !== null) {
        // Any order that was open before but is gone now = filled (or cancelled)
        for (const [id, order] of knownOrdersRef.current) {
          if (!currentMap.has(id)) {
            const side = order.task === "buy" ? "Buy" : "Sell";
            const pair = `${order.cur.toUpperCase()}/${order.ecur.toUpperCase()}`;
            const fillMsg = `${side} ${formatCrypto(order.amount)} ${order.cur.toUpperCase()} @ ${formatCrypto(order.price)} ${order.ecur.toUpperCase()}`;
            toast.success(`✅ Order filled: ${fillMsg}`, { duration: 8000, position: "top-right" });
            sendNotification("✅ Order Filled", fillMsg);
          }
        }
      }

      knownOrdersRef.current = currentMap;
    }

    // Initial load without triggering fills
    fetchOpenOrders().then(orders => {
      knownOrdersRef.current = new Map(orders.map(o => [o.orderId, o]));
    });

    timerRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      knownOrdersRef.current = null;
    };
  }, [isLoggedIn]);
}
