import { useState, useCallback } from "react";

const KEY = "ghostd_watchlist";

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function persist(watchlist: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...watchlist]));
  } catch {}
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Set<string>>(load);

  const toggle = useCallback((pair: string) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      if (next.has(pair)) {
        next.delete(pair);
      } else {
        next.add(pair);
      }
      persist(next);
      return next;
    });
  }, []);

  const isWatched = useCallback((pair: string) => watchlist.has(pair), [watchlist]);

  return { watchlist, toggle, isWatched };
}
