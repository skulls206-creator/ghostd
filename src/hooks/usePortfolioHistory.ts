import { useState, useEffect, useCallback } from "react";

const KEY = "ghostd_portfolio_history";
const MAX_POINTS = 60;
const MIN_INTERVAL_MS = 60 * 60 * 1000; // 1 hour between snapshots

export interface PortfolioPoint {
  ts: number;
  value: number;
}

function load(): PortfolioPoint[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(points: PortfolioPoint[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(points.slice(-MAX_POINTS)));
  } catch {}
}

export function usePortfolioHistory(currentValue: number | null) {
  const [history, setHistory] = useState<PortfolioPoint[]>(load);
  const [visible, setVisible] = useState(() => {
    try { return localStorage.getItem("ghostd_portfolio_chart") !== "hidden"; } catch { return true; }
  });

  const toggleVisible = useCallback(() => {
    setVisible(v => {
      const next = !v;
      try { localStorage.setItem("ghostd_portfolio_chart", next ? "shown" : "hidden"); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    if (currentValue === null || currentValue <= 0) return;
    const now = Date.now();
    const pts = load();
    const last = pts[pts.length - 1];
    if (last && now - last.ts < MIN_INTERVAL_MS) {
      setHistory(pts);
      return;
    }
    const next = [...pts, { ts: now, value: currentValue }].slice(-MAX_POINTS);
    save(next);
    setHistory(next);
  }, [currentValue]);

  return { history, visible, toggleVisible };
}
