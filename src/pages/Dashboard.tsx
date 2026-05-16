import { apiFetch } from "@/lib/apiFetch";
import { useMemo, useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { useGetBalance, useGetTicker, useGetMe } from "@/api";
import { formatCrypto } from "@/lib/utils";
import { ArrowRightLeft, TrendingUp, TrendingDown, Eye, EyeOff, ArrowUpRight, Wallet as WalletIcon, Activity, BarChart2, GripVertical, Lock, Unlock } from "lucide-react";
import { motion, Reorder, useDragControls } from "framer-motion";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
} from "recharts";
import { usePortfolioHistory } from "@/hooks/usePortfolioHistory";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { CoinIcon } from "@/components/CoinIcon";
import { cn } from "@/lib/utils";

interface PricePoint { ts: number; price: number; }

function usePriceHistory7d(pair: string) {
  return useQuery<{ points: PricePoint[] }>({
    queryKey: ["price-history", pair, "7"],
    queryFn: async () => {
      const r = await apiFetch(`/api/market/price-history?pair=${pair}&days=7`);
      if (!r.ok) throw new Error("price-history failed");
      return r.json();
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

function Sparkline({ currencyName }: { currencyName: string }) {
  const pair = ["usdt", "uusd", "dai"].includes(currencyName.toLowerCase())
    ? null
    : `${currencyName.toLowerCase()}_usdt`;

  const { data } = usePriceHistory7d(pair ?? "crp_usdt");

  if (!pair || !data?.points?.length || data.points.length < 3) {
    return <div className="w-16 h-8" />;
  }

  const pts = data.points.slice(-50);
  const prices = pts.map(p => p.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;

  const W = 64;
  const H = 28;
  const coords = pts.map((p, i) => ({
    x: (i / (pts.length - 1)) * W,
    y: H - ((p.price - minP) / range) * H,
  }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPath = path + ` L${W},${H} L0,${H} Z`;

  const firstPrice = prices[0]!;
  const lastPrice  = prices[prices.length - 1]!;
  const isUp = lastPrice >= firstPrice;
  const color = isUp ? "hsl(142,71%,45%)" : "hsl(0,84%,60%)";
  const pctChange = ((lastPrice - firstPrice) / firstPrice) * 100;

  return (
    <div className="flex items-center gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-16 h-7 shrink-0">
        <defs>
          <linearGradient id={`spark-${currencyName}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#spark-${currencyName})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={`text-[11px] font-mono font-semibold tabular-nums ${isUp ? "text-success" : "text-danger"}`}>
        {isUp ? "+" : ""}{pctChange.toFixed(2)}%
      </span>
    </div>
  );
}

function PortfolioTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;
  const d = new Date(pt.ts);
  return (
    <div className="bg-popover border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] shadow-xl backdrop-blur-md">
      <p className="text-muted-foreground mb-1">{d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      <p className="font-mono font-bold text-foreground tabular-nums text-sm">${formatCrypto(pt.value, 2)}</p>
    </div>
  );
}

export function Dashboard() {
  const { data: session } = useGetMe();
  const { data: balanceData, isLoading: loadingBalances } = useGetBalance();
  const { data: tickers, isLoading: loadingTickers } = useGetTicker({
    query: { refetchInterval: 15000 }
  });

  const portfolioValue = useMemo(() => {
    if (!balanceData?.balances || !tickers) return 0;
    return balanceData.balances.reduce((acc, b) => {
      if (b.currency.name === "usdt" || b.currency.name === "uusd") return acc + b.balance;
      const ticker = tickers.find(t => t.cur === b.currency.name && (t.ecur === "usdt" || t.ecur === "uusd"));
      if (ticker) return acc + b.balance * ticker.lastPrice;
      return acc;
    }, 0);
  }, [balanceData, tickers]);

  const { history, visible, toggleVisible } = usePortfolioHistory(
    loadingBalances || loadingTickers ? null : portfolioValue
  );

  const portfolioChange = useMemo(() => {
    if (history.length < 2) return null;
    const first = history[0]!.value;
    const last  = history[history.length - 1]!.value;
    if (first === 0) return null;
    return { abs: last - first, pct: ((last - first) / first) * 100 };
  }, [history]);

  const pnl24h = useMemo(() => {
    if (!balanceData?.balances || !tickers) return null;
    let total = 0;
    let hasTicker = false;
    for (const b of balanceData.balances) {
      if (b.balance <= 0) continue;
      if (b.currency.name === "usdt" || b.currency.name === "uusd") continue;
      const ticker = tickers.find(t => t.cur === b.currency.name && (t.ecur === "usdt" || t.ecur === "uusd"));
      if (ticker && ticker.open > 0) {
        total += b.balance * (ticker.lastPrice - ticker.open);
        hasTicker = true;
      }
    }
    return hasTicker ? total : null;
  }, [balanceData, tickers]);

  const usdValues = useMemo(() => {
    if (!balanceData?.balances || !tickers) return new Map<number, number>();
    const map = new Map<number, number>();
    for (const b of balanceData.balances) {
      if (b.currency.name === "usdt" || b.currency.name === "uusd") {
        map.set(b.id, b.balance);
      } else {
        const ticker = tickers.find(t => t.cur === b.currency.name && (t.ecur === "usdt" || t.ecur === "uusd"));
        map.set(b.id, ticker ? b.balance * ticker.lastPrice : 0);
      }
    }
    return map;
  }, [balanceData, tickers]);

  if (loadingBalances || loadingTickers) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-5 h-5 border border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const chartData = history.map(p => ({
    ...p,
    label: new Date(p.ts).toLocaleDateString([], { month: "short", day: "numeric" }),
  }));

  const activeCurrencies = balanceData?.balances.filter(b => b.balance > 0).length || 0;
  const totalAssets = balanceData?.balances.length || 0;
  const isUp = (portfolioChange?.pct ?? 0) >= 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card className="border-white/[0.04] bg-gradient-to-br from-card via-card to-primary/[0.03] overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(188_97%_43%_/_0.06),_transparent_60%)]" />
        <div className="relative p-5 md:p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                {session?.user?.name ? `${session.user.name}'s Portfolio` : "Portfolio Value"}
              </p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-4xl md:text-5xl font-bold tracking-tight text-foreground font-mono tabular-nums leading-none">
                  ${formatCrypto(portfolioValue, 2)}
                </span>
                {portfolioChange && (
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold font-mono tabular-nums ${isUp ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isUp ? "+" : ""}{portfolioChange.pct.toFixed(2)}%
                  </div>
                )}
              </div>
              {pnl24h !== null && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-semibold">24h P&L</span>
                  <span className={cn(
                    "text-sm font-mono font-bold tabular-nums",
                    pnl24h >= 0 ? "text-success" : "text-danger"
                  )}>
                    {pnl24h >= 0 ? "+" : "−"}${formatCrypto(Math.abs(pnl24h), 2)}
                  </span>
                  {portfolioValue > 0 && (
                    <span className={cn(
                      "text-[11px] font-mono tabular-nums",
                      pnl24h >= 0 ? "text-success/60" : "text-danger/60"
                    )}>
                      ({pnl24h >= 0 ? "+" : ""}{((pnl24h / portfolioValue) * 100).toFixed(2)}%)
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              {history.length > 1 && (
                <button
                  onClick={toggleVisible}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.04] transition-colors"
                  title={visible ? "Hide chart" : "Show chart"}
                >
                  {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              )}
              <Link
                href="/markets"
                className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-primary text-background text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Trade
              </Link>
            </div>
          </div>

          {visible && history.length > 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 100 }}
              exit={{ opacity: 0, height: 0 }}
              className="-mx-2 mt-2"
            >
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(188,97%,43%)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(188,97%,43%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" hide />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip content={<PortfolioTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(188,97%,43%)"
                    strokeWidth={2}
                    fill="url(#portfolioGrad)"
                    dot={false}
                    activeDot={{ r: 3, fill: "hsl(188,97%,43%)", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-white/[0.04] p-4 bg-card hover:bg-white/[0.02] transition-colors text-center">
          <div className="flex justify-center mb-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <WalletIcon className="w-3.5 h-3.5 text-primary" />
            </div>
          </div>
          <p className="text-lg font-bold font-mono tabular-nums text-foreground">{activeCurrencies}</p>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-0.5">Active Assets</p>
        </Card>
        <Card className="border-white/[0.04] p-4 bg-card hover:bg-white/[0.02] transition-colors text-center">
          <div className="flex justify-center mb-2">
            <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-success" />
            </div>
          </div>
          <p className="text-lg font-bold font-mono tabular-nums text-foreground">{totalAssets}</p>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-0.5">Total Coins</p>
        </Card>
        <Card className="border-white/[0.04] p-4 bg-card hover:bg-white/[0.02] transition-colors text-center">
          <div className="flex justify-center mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#5865F2]/10 flex items-center justify-center">
              <BarChart2 className="w-3.5 h-3.5 text-[#5865F2]" />
            </div>
          </div>
          <p className={`text-lg font-bold font-mono tabular-nums ${isUp ? "text-success" : "text-danger"}`}>
            {portfolioChange ? `${isUp ? "+" : ""}$${formatCrypto(Math.abs(portfolioChange.abs), 2)}` : "$0.00"}
          </p>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-0.5">Session P&L</p>
        </Card>
      </div>

      <AssetList balances={balanceData?.balances ?? []} usdValues={usdValues} portfolioValue={portfolioValue} />
    </motion.div>
  );
}

const ASSET_ORDER_KEY = "crp_asset_order";

function getStoredOrder(): string[] {
  try {
    const raw = localStorage.getItem(ASSET_ORDER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveOrder(order: string[]) {
  try { localStorage.setItem(ASSET_ORDER_KEY, JSON.stringify(order)); } catch {}
}

function AssetList({ balances, usdValues, portfolioValue }: { balances: any[]; usdValues: Map<number, number>; portfolioValue: number }) {
  const [reorderMode, setReorderMode] = useState(false);

  const sortedBalances = useMemo(() => {
    const stored = getStoredOrder();
    if (stored.length === 0) return balances;
    const copy = [...balances];
    copy.sort((a, b) => {
      const ai = stored.indexOf(a.currency.name);
      const bi = stored.indexOf(b.currency.name);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    return copy;
  }, [balances]);

  const [items, setItems] = useState(sortedBalances);

  useEffect(() => {
    setItems(sortedBalances);
  }, [sortedBalances]);

  const handleReorder = useCallback((newItems: any[]) => {
    setItems(newItems);
  }, []);

  const handleDone = useCallback(() => {
    saveOrder(items.map((b: any) => b.currency.name));
    setReorderMode(false);
  }, [items]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Your Assets</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => reorderMode ? handleDone() : setReorderMode(true)}
            className={cn(
              "text-[11px] font-medium transition-colors flex items-center gap-1",
              reorderMode ? "text-primary" : "text-muted-foreground hover:text-primary"
            )}
          >
            {reorderMode ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {reorderMode ? "Done" : "Reorder"}
          </button>
          <Link href="/wallet?deposit=crp" className="text-[11px] text-muted-foreground hover:text-primary transition-colors font-medium">
            Wallet →
          </Link>
        </div>
      </div>

      {reorderMode ? (
        <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-1">
          {items.map((b: any) => (
            <DraggableAssetRow key={b.id} b={b} usdVal={usdValues.get(b.id) ?? 0} allocationPct={portfolioValue > 0 ? ((usdValues.get(b.id) ?? 0) / portfolioValue) * 100 : 0} />
          ))}
        </Reorder.Group>
      ) : (
        <div className="space-y-1">
          {items.map((b: any, i: number) => {
            const usdVal = usdValues.get(b.id) ?? 0;
            const allocationPct = portfolioValue > 0 ? (usdVal / portfolioValue) * 100 : 0;
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={`/wallet?deposit=${b.currency.name.toLowerCase()}`}>
                  <Card className="border-white/[0.04] hover:border-primary/20 bg-card hover:bg-white/[0.015] transition-all duration-200 cursor-pointer group overflow-hidden">
                    <div className="p-3.5 flex items-center gap-3">
                      <CoinIcon coin={b.currency.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm uppercase tracking-wide text-foreground">{b.currency.name}</span>
                          <span className="text-muted-foreground/40 text-[10px] truncate hidden sm:block">{b.currency.fullname}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="font-mono text-xs text-foreground/80 tabular-nums">{formatCrypto(b.balance)}</span>
                          {usdVal > 0.01 && (
                            <span className="text-[10px] text-muted-foreground/50 font-mono tabular-nums">≈ ${formatCrypto(usdVal, 2)}</span>
                          )}
                          {b.reserve > 0 && (
                            <span className="text-[10px] text-muted-foreground/30 font-mono tabular-nums">{formatCrypto(b.reserve)} locked</span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-3">
                        {allocationPct > 1 && (
                          <div className="hidden md:flex items-center gap-1.5 w-20">
                            <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                              <div className="h-full bg-primary/40 rounded-full" style={{ width: `${Math.min(allocationPct, 100)}%` }} />
                            </div>
                            <span className="text-[9px] font-mono text-muted-foreground/40 tabular-nums w-8 text-right">{allocationPct.toFixed(0)}%</span>
                          </div>
                        )}
                        <Sparkline currencyName={b.currency.name} />
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/15 group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DraggableAssetRow({ b, usdVal, allocationPct }: { b: any; usdVal: number; allocationPct: number }) {
  const controls = useDragControls();

  return (
    <Reorder.Item value={b} dragListener={false} dragControls={controls}>
      <Card className="border-primary/20 bg-card transition-all duration-200 overflow-hidden">
        <div className="p-3.5 flex items-center gap-3">
          <div
            onPointerDown={(e) => controls.start(e)}
            className="touch-none cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-white/[0.06] transition-colors"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground/40" />
          </div>
          <CoinIcon coin={b.currency.name} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm uppercase tracking-wide text-foreground">{b.currency.name}</span>
              <span className="text-muted-foreground/40 text-[10px] truncate hidden sm:block">{b.currency.fullname}</span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="font-mono text-xs text-foreground/80 tabular-nums">{formatCrypto(b.balance)}</span>
              {usdVal > 0.01 && (
                <span className="text-[10px] text-muted-foreground/50 font-mono tabular-nums">≈ ${formatCrypto(usdVal, 2)}</span>
              )}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            {allocationPct > 1 && (
              <span className="text-[9px] font-mono text-muted-foreground/40 tabular-nums">{allocationPct.toFixed(0)}%</span>
            )}
          </div>
        </div>
      </Card>
    </Reorder.Item>
  );
}
