import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useGetTicker } from "@/api";
import { Input } from "@/components/ui/input";
import { formatCrypto, cn } from "@/lib/utils";
import { Search, Copy, TrendingUp, TrendingDown, BarChart2, RefreshCw, Star, ArrowUpRight, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuLabel, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useClipboard } from "@/hooks/useClipboard";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Card } from "@/components/ui/card";
import { CoinIcon } from "@/components/CoinIcon";

function PriceChange({ ticker }: { ticker: any }) {
  const open = ticker.open || ticker.lastPrice;
  const isUp = ticker.lastPrice >= open;
  const changePct = open > 0 ? ((ticker.lastPrice - open) / open) * 100 : 0;
  if (changePct === 0) {
    return <span className="text-[11px] font-mono text-muted-foreground/40 tabular-nums">0.00%</span>;
  }
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-[11px] font-mono font-semibold tabular-nums px-1.5 py-0.5 rounded",
      isUp ? "text-success bg-success/8" : "text-danger bg-danger/8"
    )}>
      {isUp ? "+" : ""}{changePct.toFixed(2)}%
    </span>
  );
}

function SpreadBar({ bid, ask }: { bid: number; ask: number }) {
  if (bid <= 0 || ask <= 0) return null;
  const spread = ((ask - bid) / ask) * 100;
  return (
    <div className="flex items-center gap-1.5 w-16">
      <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden flex">
        <div className="h-full bg-success/50 rounded-l-full" style={{ width: "50%" }} />
        <div className="h-full bg-danger/50 rounded-r-full" style={{ width: "50%" }} />
      </div>
      <span className="text-[8px] font-mono text-muted-foreground/30 tabular-nums">{spread.toFixed(1)}%</span>
    </div>
  );
}

function MarketStatCards({ tickers }: { tickers: any[] }) {
  const stats = useMemo(() => {
    let totalVol = 0;
    let topGainer = { pair: "", pct: -Infinity };
    let topLoser = { pair: "", pct: Infinity };

    tickers.forEach((t: any) => {
      totalVol += t.quoteVolume || 0;
      const open = t.open || t.lastPrice;
      if (open > 0) {
        const pct = ((t.lastPrice - open) / open) * 100;
        if (pct > topGainer.pct) topGainer = { pair: t.pair, pct };
        if (pct < topLoser.pct) topLoser = { pair: t.pair, pct };
      }
    });

    return { totalVol, topGainer, topLoser, pairCount: tickers.length };
  }, [tickers]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <Card className="border-white/[0.04] p-3 bg-card text-center">
        <Activity className="w-4 h-4 text-primary mx-auto mb-1.5 opacity-60" />
        <p className="text-lg font-bold font-mono tabular-nums text-foreground">{stats.pairCount}</p>
        <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">Active Pairs</p>
      </Card>
      <Card className="border-white/[0.04] p-3 bg-card text-center">
        <BarChart2 className="w-4 h-4 text-[#5865F2] mx-auto mb-1.5 opacity-60" />
        <p className="text-lg font-bold font-mono tabular-nums text-foreground">${formatCrypto(stats.totalVol, 0)}</p>
        <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">24h Volume</p>
      </Card>
      <Card className="border-white/[0.04] p-3 bg-card text-center">
        <TrendingUp className="w-4 h-4 text-success mx-auto mb-1.5 opacity-60" />
        <p className="text-sm font-bold font-mono tabular-nums text-success">
          {stats.topGainer.pct > -Infinity ? `+${stats.topGainer.pct.toFixed(2)}%` : "—"}
        </p>
        <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">
          Top Gainer{stats.topGainer.pair ? ` · ${stats.topGainer.pair.split("_")[0]?.toUpperCase()}` : ""}
        </p>
      </Card>
      <Card className="border-white/[0.04] p-3 bg-card text-center">
        <TrendingDown className="w-4 h-4 text-danger mx-auto mb-1.5 opacity-60" />
        <p className="text-sm font-bold font-mono tabular-nums text-danger">
          {stats.topLoser.pct < Infinity ? `${stats.topLoser.pct.toFixed(2)}%` : "—"}
        </p>
        <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">
          Top Loser{stats.topLoser.pair ? ` · ${stats.topLoser.pair.split("_")[0]?.toUpperCase()}` : ""}
        </p>
      </Card>
    </div>
  );
}

export function Markets() {
  const { data: tickers, isLoading, refetch } = useGetTicker({ query: { refetchInterval: 10000 } });
  const [search, setSearch] = useState("");
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const [, navigate] = useLocation();
  const { copy } = useClipboard();
  const { isWatched, toggle } = useWatchlist();

  const allEnabled = useMemo(() => tickers?.filter((t: any) => t.enable) ?? [], [tickers]);
  const watchedCount = useMemo(() => allEnabled.filter((t: any) => isWatched(t.pair)).length, [allEnabled, isWatched]);

  const filtered = useMemo(() => {
    let list = allEnabled.filter((t: any) =>
      t.pair.toLowerCase().includes(search.toLowerCase()) ||
      t.cur.toLowerCase().includes(search.toLowerCase())
    );
    if (showWatchlistOnly && watchedCount > 0) list = list.filter((t: any) => isWatched(t.pair));
    return [...list].sort((a: any, b: any) => {
      const aw = isWatched(a.pair) ? 0 : 1;
      const bw = isWatched(b.pair) ? 0 : 1;
      if (aw !== bw) return aw - bw;
      return (b.quoteVolume || 0) - (a.quoteVolume || 0);
    });
  }, [allEnabled, search, showWatchlistOnly, watchedCount, isWatched]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Markets</h1>
          <p className="text-muted-foreground/60 text-[11px] mt-0.5">Live prices · Right-click any row for quick actions</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowWatchlistOnly(v => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-semibold transition-all shrink-0",
              showWatchlistOnly
                ? "bg-yellow-500/10 border-yellow-500/25 text-yellow-400"
                : "border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/[0.12]"
            )}
          >
            <Star className={cn("w-3 h-3", showWatchlistOnly && "fill-yellow-400 text-yellow-400")} />
            {watchedCount > 0 ? `${watchedCount}` : "★"}
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/[0.12] transition-all shrink-0"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <div className="w-full sm:w-52">
            <Input
              icon={<Search className="w-3 h-3" />}
              placeholder="Search pairs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {!isLoading && allEnabled.length > 0 && (
        <MarketStatCards tickers={allEnabled} />
      )}

      {showWatchlistOnly && watchedCount === 0 && (
        <Card className="border-yellow-500/10 bg-yellow-500/[0.02] p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Watchlist is empty</p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">Click the ★ star on any pair to start tracking it</p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground/50">Loading markets...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-muted/50 border border-white/[0.04] flex items-center justify-center">
                <Search className="w-6 h-6 text-muted-foreground/20" />
              </div>
              <p className="text-sm text-muted-foreground/50">No pairs found</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
            <AnimatePresence initial={false}>
              {filtered.map((t: any, i: number) => {
                const watched = isWatched(t.pair);
                const baseCur = t.cur.toUpperCase();
                const quoteCur = t.ecur.toUpperCase();

                return (
                  <ContextMenu key={t.pair}>
                    <ContextMenuTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Card
                          className={cn(
                            "border-white/[0.04] hover:border-primary/15 bg-card hover:bg-white/[0.015] transition-all duration-200 cursor-pointer group overflow-hidden",
                            watched && "border-yellow-500/10"
                          )}
                          onClick={() => navigate(`/trade/${t.pair}`)}
                        >
                          <div className="p-3 sm:p-3.5 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(t.pair); }}
                              className={cn(
                                "shrink-0 w-6 h-6 flex items-center justify-center rounded transition-all",
                                watched
                                  ? "text-yellow-400"
                                  : "text-muted-foreground/10 hover:text-yellow-400 group-hover:text-muted-foreground/30"
                              )}
                            >
                              <Star className={cn("w-3.5 h-3.5", watched && "fill-yellow-400")} />
                            </button>

                            <CoinIcon coin={t.cur} size="md" />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm tracking-wide text-foreground">{baseCur}</span>
                                <span className="text-muted-foreground/30 text-[10px]">/ {quoteCur}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-xs font-semibold text-foreground tabular-nums">{formatCrypto(t.lastPrice)}</span>
                                <PriceChange ticker={t} />
                              </div>
                            </div>

                            <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-[8px] uppercase tracking-widest text-muted-foreground/30 mb-0.5">Vol 24h</p>
                                  <p className="font-mono text-[11px] text-muted-foreground/60 tabular-nums">{formatCrypto(t.baseVolume, 2)} {baseCur}</p>
                                </div>
                              </div>
                            </div>

                            <div className="hidden md:flex flex-col items-end gap-0.5 shrink-0 w-24">
                              <div className="flex items-center gap-2 w-full">
                                <span className="text-[9px] text-muted-foreground/30">B</span>
                                <span className="font-mono text-[11px] text-success/80 tabular-nums flex-1 text-right">{formatCrypto(t.bid)}</span>
                              </div>
                              <div className="flex items-center gap-2 w-full">
                                <span className="text-[9px] text-muted-foreground/30">A</span>
                                <span className="font-mono text-[11px] text-danger/80 tabular-nums flex-1 text-right">{formatCrypto(t.ask)}</span>
                              </div>
                            </div>

                            <div className="hidden lg:block shrink-0">
                              <SpreadBar bid={t.bid} ask={t.ask} />
                            </div>

                            <Link
                              href={`/trade/${t.pair}`}
                              onClick={(e: any) => e.stopPropagation()}
                              className="shrink-0 inline-flex items-center gap-1 h-7 px-3 rounded-md text-[10px] font-semibold text-primary border border-primary/20 hover:bg-primary hover:text-background transition-all duration-150"
                            >
                              Trade
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </Card>
                      </motion.div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-52">
                      <ContextMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {baseCur}/{quoteCur}
                      </ContextMenuLabel>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => navigate(`/trade/${t.pair}`)}>
                        <TrendingUp className="w-3.5 h-3.5 mr-2 text-primary" />
                        Trade this pair
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => toggle(t.pair)}>
                        <Star className={cn("w-3.5 h-3.5 mr-2", watched ? "fill-yellow-400 text-yellow-400" : "")} />
                        {watched ? "Remove from watchlist" : "Add to watchlist"}
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => copy(`${baseCur}/${quoteCur}`, "Pair copied")}>
                        <Copy className="w-3.5 h-3.5 mr-2" />
                        Copy pair name
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => copy(String(t.lastPrice), "Price copied")}>
                        <BarChart2 className="w-3.5 h-3.5 mr-2" />
                        Copy last price
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => copy(String(t.bid), "Bid copied")}>
                        <Copy className="w-3.5 h-3.5 mr-2 text-success" />
                        Copy best bid
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => copy(String(t.ask), "Ask copied")}>
                        <Copy className="w-3.5 h-3.5 mr-2 text-danger" />
                        Copy best ask
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => refetch()}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                        Refresh prices
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
