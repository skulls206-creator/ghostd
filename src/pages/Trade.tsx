import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  useGetTradingPairs,
  useGetOrderBook,
  useGetTradeHistory,
  useGetBalance,
  usePlaceBuyOrder,
  usePlaceSellOrder,
  useGetOrders,
  useCancelOrder,
  getGetOrdersQueryKey,
  getGetBalanceQueryKey,
} from "@/api";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { formatCrypto, formatTime, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { ChevronDown, Check, Copy, Gauge, BookOpen, XCircle, RefreshCw, ClipboardList, GripVertical, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuLabel, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useClipboard } from "@/hooks/useClipboard";
import { useNotifications } from "@/hooks/useNotifications";

const LAST_PAIR_KEY = "crp_last_pair";
const PANEL_ORDER_KEY  = "crp_trade_panel_order";
const PANEL_ORDER_VER  = "crp_trade_panel_order_v";
const PANEL_ORDER_CUR_VER = "2";
const PANEL_WIDTHS_KEY = "crp_trade_panel_widths";
const DEFAULT_PANEL_WIDTHS: [number, number, number] = [33, 27, 40];

function getStoredPanelWidths(): [number, number, number] {
  try {
    const raw = localStorage.getItem(PANEL_WIDTHS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 3 && parsed.every((n: unknown) => typeof n === "number")) {
        return parsed as [number, number, number];
      }
    }
  } catch {}
  return [...DEFAULT_PANEL_WIDTHS] as [number, number, number];
}

function savePanelWidths(w: [number, number, number]) {
  try { localStorage.setItem(PANEL_WIDTHS_KEY, JSON.stringify(w)); } catch {}
}

type PanelId = "trades" | "book" | "entry";

const PANEL_LABELS: Record<PanelId, string> = {
  trades: "Recent Trades",
  book: "Order Book",
  entry: "Order Entry",
};

const DEFAULT_PANEL_ORDER: PanelId[] = ["entry", "book", "trades"];

function getStoredPanelOrder(): PanelId[] {
  try {
    const storedVer = localStorage.getItem(PANEL_ORDER_VER);
    if (storedVer !== PANEL_ORDER_CUR_VER) {
      localStorage.removeItem(PANEL_ORDER_KEY);
      localStorage.setItem(PANEL_ORDER_VER, PANEL_ORDER_CUR_VER);
      return DEFAULT_PANEL_ORDER;
    }
    const raw = localStorage.getItem(PANEL_ORDER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 3) return parsed;
    }
  } catch {}
  return DEFAULT_PANEL_ORDER;
}

function savePanelOrder(order: PanelId[]) {
  try {
    localStorage.setItem(PANEL_ORDER_KEY, JSON.stringify(order));
    localStorage.setItem(PANEL_ORDER_VER, PANEL_ORDER_CUR_VER);
  } catch {}
}

const PANEL_GRID_CLASSES: Record<PanelId, string> = {
  trades: "min-w-0",
  book: "min-w-0",
  entry: "min-w-0",
};

function DraggablePanel({ id, children, reorderMode }: { id: PanelId; children: React.ReactNode; reorderMode: boolean }) {
  const controls = useDragControls();

  if (!reorderMode) {
    return <div className={PANEL_GRID_CLASSES[id]}>{children}</div>;
  }

  return (
    <Reorder.Item value={id} dragListener={false} dragControls={controls} className={PANEL_GRID_CLASSES[id]}>
      <div className="relative">
        <div
          onPointerDown={(e) => controls.start(e)}
          className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 touch-none cursor-grab active:cursor-grabbing flex items-center gap-1 px-2 py-1 rounded-b-md bg-primary/15 border border-primary/20 border-t-0"
        >
          <GripVertical className="w-3 h-3 text-primary/70" />
          <span className="text-[9px] font-semibold text-primary/70 uppercase tracking-wider">{PANEL_LABELS[id]}</span>
        </div>
        <div className="ring-1 ring-primary/20 rounded-lg">
          {children}
        </div>
      </div>
    </Reorder.Item>
  );
}

function PairDropdown({ currentPair, onSelect }: { currentPair: string; onSelect: (p: string) => void }) {
  const { data } = useGetTradingPairs({ query: { refetchInterval: 30000 } });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const pairs = data?.pairs ?? [];
  const current = pairs.find((p) => p.pair === currentPair);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 group relative"
        type="button"
      >
        <h1 className="text-xl font-bold uppercase text-foreground tracking-wide">
          {current?.pairShow ?? currentPair.replace("_", "/").toUpperCase()}
        </h1>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200 mt-0.5",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full -left-4 mt-1.5 z-[100] min-w-[180px] bg-card border border-white/[0.08] rounded-lg shadow-2xl overflow-hidden"
          >
            {pairs.length === 0 ? (
              <div className="px-3 py-2.5 text-xs text-muted-foreground">Loading pairs…</div>
            ) : (
              pairs.map((p) => (
                <button
                  key={p.pair}
                  type="button"
                  onClick={() => {
                    onSelect(p.pair);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase hover:bg-white/[0.04] transition-colors",
                    p.pair === currentPair && "text-primary bg-primary/5"
                  )}
                >
                  {p.pairShow}
                  {p.pair === currentPair && <Check className="w-3 h-3" />}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TickerSummary({ pair, onPairSelect }: { pair: string; onPairSelect: (p: string) => void }) {
  const { data } = useGetTradingPairs({ query: { refetchInterval: 10000 } });
  const info = data?.pairs.find((p) => p.pair === pair);

  return (
    <div className="px-4 py-2.5 border-b border-white/[0.04] flex flex-wrap items-center gap-x-8 gap-y-2">
      <PairDropdown currentPair={pair} onSelect={onPairSelect} />
      <div className="flex gap-5 overflow-x-auto">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Last Price</p>
          <p className="font-mono text-sm font-bold text-foreground tabular-nums">{info ? formatCrypto(info.close) : "—"}</p>
        </div>
        <div className="hidden sm:block">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">24h High</p>
          <p className="font-mono text-xs text-foreground tabular-nums">{info ? formatCrypto(info.high) : "—"}</p>
        </div>
        <div className="hidden sm:block">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">24h Low</p>
          <p className="font-mono text-xs text-foreground tabular-nums">{info ? formatCrypto(info.low) : "—"}</p>
        </div>
        <div className="hidden md:block">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">24h Volume</p>
          <p className="font-mono text-xs text-foreground tabular-nums">{info ? formatCrypto(info.volume, 2) : "—"}</p>
        </div>
      </div>
    </div>
  );
}

type Period = "24H" | "7D" | "1M" | "1Y" | "ALL";

const PERIODS: { label: Period; ms: number | null }[] = [
  { label: "24H", ms: 24 * 60 * 60 * 1000 },
  { label: "7D",  ms: 7  * 24 * 60 * 60 * 1000 },
  { label: "1M",  ms: 30 * 24 * 60 * 60 * 1000 },
  { label: "1Y",  ms: 365 * 24 * 60 * 60 * 1000 },
  { label: "ALL", ms: null },
];

function formatLabel(ts: number, period: Period): string {
  const d = new Date(ts);
  if (period === "24H") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (period === "7D")  return d.toLocaleDateString([], { weekday: "short", hour: "2-digit" });
  if (period === "1M")  return d.toLocaleDateString([], { month: "short", day: "numeric" });
  return d.toLocaleDateString([], { year: "numeric", month: "short" });
}

const PERIOD_DAYS: Record<Period, string> = {
  "24H": "1",
  "7D":  "7",
  "1M":  "30",
  "1Y":  "365",
  "ALL": "max",
};

const KRAKEN_PAIRS = new Set(["btc", "xmr", "eth", "ltc"]);

interface PricePoint { ts: number; price: number; }

async function fetchPriceHistory(pair: string, days: string): Promise<PricePoint[]> {
  const res = await fetch(`/api/market/price-history?pair=${pair}&days=${days}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`price-history ${res.status}`);
  const json = await res.json() as { points: PricePoint[] };
  return json.points ?? [];
}

function TradeChart({ pair }: { pair: string }) {
  const [period, setPeriod] = useState<Period>("ALL");
  const days = PERIOD_DAYS[period];
  const baseCurrency = pair.split("_")[0] ?? "";
  const hasKraken = KRAKEN_PAIRS.has(baseCurrency);

  const { data: rawPoints, isFetching } = useQuery<PricePoint[]>({
    queryKey: ["price-history", pair, days],
    queryFn: () => fetchPriceHistory(pair, days),
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  const chartData = useMemo(() => {
    if (!rawPoints) return [];
    const now = Date.now();
    const periodDef = PERIODS.find((p) => p.label === period)!;
    const cutoff = periodDef.ms !== null ? now - periodDef.ms : 0;

    return rawPoints
      .filter((p) => p.ts >= cutoff)
      .map((p) => ({
        ts: p.ts,
        label: formatLabel(p.ts, period),
        price: p.price,
      }));
  }, [rawPoints, period]);

  const isEmpty = chartData.length === 0;

  return (
    <div className="w-full flex flex-col h-[320px]">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2 px-4 pt-3">
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-widest">Price History</p>
          {!hasKraken && (
            <span className="text-[9px] text-yellow-500/70 border border-yellow-500/15 px-1.5 py-0.5 rounded font-medium">
              Exchange data
            </span>
          )}
          {hasKraken && (
            <span className="text-[9px] text-primary/60 border border-primary/15 px-1.5 py-0.5 rounded font-medium">
              Kraken historical
            </span>
          )}
          {isFetching && (
            <span className="text-[9px] text-muted-foreground animate-pulse">Loading…</span>
          )}
        </div>
        <div className="flex gap-px">
          {PERIODS.map(({ label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setPeriod(label)}
              className={cn(
                "px-2 py-1 text-[10px] font-bold transition-all",
                period === label
                  ? "text-primary"
                  : "text-muted-foreground/40 hover:text-muted-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 px-1">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
            {isFetching ? "Loading…" : "No data available"}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(188,97%,43%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(188,97%,43%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fill: "hsl(215,12%,35%)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={60}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "hsl(215,12%,35%)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={68}
                tickFormatter={(v: number) => formatCrypto(v, 4)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(240,12%,7%)",
                  borderColor: "rgba(255,255,255,0.06)",
                  borderRadius: "6px",
                  color: "#F0F0F5",
                  fontSize: "11px",
                }}
                itemStyle={{ color: "hsl(188,97%,43%)", fontWeight: "bold" }}
                labelStyle={{ color: "hsl(215,12%,50%)", fontSize: 10 }}
                formatter={(v: number) => [formatCrypto(v, 6), "Price"]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="hsl(188,97%,43%)"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorPrice)"
                dot={false}
                activeDot={{ r: 3, fill: "hsl(188,97%,43%)", stroke: "hsl(240,14%,5%)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function OrderBook({ pair, compact = false }: { pair: string; compact?: boolean }) {
  const { data } = useGetOrderBook({ pair }, { query: { refetchInterval: 5000 } });
  const { copy } = useClipboard();

  const asks = [...(data?.asks || [])].sort((a, b) => a.price - b.price);
  const bids = [...(data?.bids || [])].sort((a, b) => b.price - a.price);
  const maxVol =
    Math.max(...asks.map((a) => a.value), ...bids.map((b) => b.value)) || 1;

  const sectionStyle = compact
    ? { height: 220, touchAction: "pan-y" as const }
    : { touchAction: "pan-y" as const };
  const sectionClass = compact
    ? "overflow-y-auto overscroll-contain flex flex-col-reverse gap-[1px]"
    : "flex-1 overflow-y-auto overscroll-contain flex flex-col-reverse gap-[1px]";

  return (
    <div className={cn("flex flex-col font-mono text-[11px] px-0", !compact && "h-full")}>
      <div className="grid grid-cols-3 text-muted-foreground/40 font-sans pb-1.5 border-b border-white/[0.04] mb-1 text-[9px] uppercase tracking-widest px-3">
        <span>Price</span>
        <span className="text-center">Amount</span>
        <span className="text-right">Total</span>
      </div>
      <div className={sectionClass} style={sectionStyle}>
        {asks.map((ask, i) => (
          <ContextMenu key={`ask-${i}`}>
            <ContextMenuTrigger asChild>
              <div className="relative grid grid-cols-3 h-7 items-center px-3 z-10 group hover:bg-white/[0.03] cursor-pointer">
                <span className="text-danger font-semibold tabular-nums">{formatCrypto(ask.price)}</span>
                <span className="text-center text-foreground/70 tabular-nums">{formatCrypto(ask.amount)}</span>
                <span className="text-right text-muted-foreground/50 tabular-nums">{formatCrypto(ask.value)}</span>
                <div
                  className="absolute top-0 right-0 h-full bg-danger/[0.06] -z-10"
                  style={{ width: `${(ask.value / maxVol) * 100}%` }}
                />
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-44">
              <ContextMenuLabel className="text-[10px] text-danger">Ask @ {formatCrypto(ask.price)}</ContextMenuLabel>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => copy(String(ask.price), "Price copied")}>
                <Copy className="w-3 h-3 mr-2" /> Copy price
              </ContextMenuItem>
              <ContextMenuItem onClick={() => copy(String(ask.amount), "Amount copied")}>
                <Copy className="w-3 h-3 mr-2" /> Copy amount
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
      <div className="py-1.5 text-center font-sans font-semibold text-[10px] border-y border-white/[0.04] my-1 text-muted-foreground/50 flex items-center justify-center gap-2">
        Spread{" "}
        {asks.length && bids.length
          ? formatCrypto(asks[0].price - bids[0].price)
          : "0.00"}
      </div>
      <div className={compact ? "overflow-y-auto overscroll-contain flex flex-col gap-[1px]" : "flex-1 overflow-y-auto overscroll-contain flex flex-col gap-[1px]"} style={sectionStyle}>
        {bids.map((bid, i) => (
          <ContextMenu key={`bid-${i}`}>
            <ContextMenuTrigger asChild>
              <div className="relative grid grid-cols-3 h-7 items-center px-3 z-10 group hover:bg-white/[0.03] cursor-pointer">
                <span className="text-success font-semibold tabular-nums">{formatCrypto(bid.price)}</span>
                <span className="text-center text-foreground/70 tabular-nums">{formatCrypto(bid.amount)}</span>
                <span className="text-right text-muted-foreground/50 tabular-nums">{formatCrypto(bid.value)}</span>
                <div
                  className="absolute top-0 right-0 h-full bg-success/[0.06] -z-10"
                  style={{ width: `${(bid.value / maxVol) * 100}%` }}
                />
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-44">
              <ContextMenuLabel className="text-[10px] text-success">Bid @ {formatCrypto(bid.price)}</ContextMenuLabel>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => copy(String(bid.price), "Price copied")}>
                <Copy className="w-3 h-3 mr-2" /> Copy price
              </ContextMenuItem>
              <ContextMenuItem onClick={() => copy(String(bid.amount), "Amount copied")}>
                <Copy className="w-3 h-3 mr-2" /> Copy amount
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
    </div>
  );
}

function calcMarketImpact(
  side: "buy" | "sell",
  amount: number,
  asks: { price: number; amount: number; value: number }[],
  bids: { price: number; amount: number; value: number }[],
) {
  const orders = side === "buy"
    ? [...asks].sort((a, b) => a.price - b.price)
    : [...bids].sort((a, b) => b.price - a.price);

  const marketPrice = orders[0]?.price ?? 0;
  if (amount <= 0 || orders.length === 0) return { marketPrice, avgPrice: marketPrice, slippage: 0, totalQuote: 0, partialFill: false };

  let remaining = amount;
  let totalQuote = 0;
  let filled = 0;

  for (const o of orders) {
    if (remaining <= 0) break;
    const fill = Math.min(remaining, o.amount);
    totalQuote += fill * o.price;
    filled += fill;
    remaining -= fill;
  }

  const avgPrice = filled > 0 ? totalQuote / filled : marketPrice;
  const slippage = marketPrice > 0 ? Math.abs((avgPrice - marketPrice) / marketPrice) * 100 : 0;
  return { marketPrice, avgPrice, slippage, totalQuote, partialFill: remaining > 0 };
}

function OrderEntry({ pair }: { pair: string }) {
  const [tab, setTab]           = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [pct, setPct]           = useState(0);
  const [amountInput, setAmountInput] = useState("");
  const [limitOffsetPct, setLimitOffsetPct] = useState(2);
  const [baseOffset, setBaseOffset]   = useState(0);
  const [quoteOffset, setQuoteOffset] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const queryClient = useQueryClient();
  const buyMutation  = usePlaceBuyOrder();
  const sellMutation = usePlaceSellOrder();
  const { promptIfNeeded } = useNotifications();
  const { data: balanceData } = useGetBalance({ query: { refetchInterval: 8000 } });
  const { data: bookData }    = useGetOrderBook({ pair }, { query: { refetchInterval: 3000 } });

  const baseCurrency  = pair.split("_")[0]?.toUpperCase() ?? "";
  const quoteCurrency = pair.split("_")[1]?.toUpperCase() ?? "";
  const isBuy    = tab === "buy";
  const isLimit  = orderType === "limit";

  const asks = bookData?.asks ?? [];
  const bids = bookData?.bids ?? [];

  const rawBaseBalance  = balanceData?.balances.find((b) => b.currency.name.toLowerCase() === pair.split("_")[0])?.balance ?? 0;
  const rawQuoteBalance = balanceData?.balances.find((b) => b.currency.name.toLowerCase() === pair.split("_")[1])?.balance ?? 0;
  const baseBalance  = Math.max(0, rawBaseBalance  + baseOffset);
  const quoteBalance = Math.max(0, rawQuoteBalance + quoteOffset);

  const sortedAsks = [...asks].sort((a, b) => a.price - b.price);
  const sortedBids = [...bids].sort((a, b) => b.price - a.price);
  const marketPrice = isBuy ? (sortedAsks[0]?.price ?? 0) : (sortedBids[0]?.price ?? 0);

  const limitPrice = isLimit && marketPrice > 0
    ? isBuy
      ? marketPrice * (1 - limitOffsetPct / 100)
      : marketPrice * (1 + limitOffsetPct / 100)
    : marketPrice;

  const executionPrice = isLimit ? limitPrice : marketPrice;

  const maxBase = isBuy
    ? (executionPrice > 0 ? quoteBalance / executionPrice : 0)
    : baseBalance;

  const sliderAmount  = (pct / 100) * maxBase;
  const parsedInput   = parseFloat(amountInput);
  const amount        = amountInput !== "" && !isNaN(parsedInput) && parsedInput > 0 ? parsedInput : sliderAmount;

  const impact = useMemo(
    () => calcMarketImpact(tab, amount, asks, bids),
    [tab, amount, asks, bids]
  );

  const totalCost = isLimit ? amount * limitPrice : impact.totalQuote;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmountInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && maxBase > 0) setPct(Math.min(100, Math.round((parsed / maxBase) * 100)));
  };

  const handleSliderChange = (newPct: number) => {
    setPct(newPct);
    const newAmount = (newPct / 100) * maxBase;
    setAmountInput(newAmount > 0 ? newAmount.toFixed(6) : "");
  };

  const handleTabChange = (newTab: "buy" | "sell") => {
    setTab(newTab); setPct(0); setAmountInput("");
    setLimitOffsetPct(2);
  };

  const handleOrderTypeChange = (t: "market" | "limit") => {
    setOrderType(t); setPct(0); setAmountInput("");
    setLimitOffsetPct(2);
  };

  const isPending = buyMutation.isPending || sellMutation.isPending;
  const errorMsg  = buyMutation.error?.error || sellMutation.error?.error;

  const doSubmit = () => {
    if (amount <= 0 || executionPrice <= 0) return;
    const payload = { data: { pair, amount, price: executionPrice } };

    if (!isLimit) {
      if (isBuy) setQuoteOffset((prev) => prev - amount * marketPrice);
      else        setBaseOffset((prev) => prev - amount);
    }

    const options = {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
        queryClient.refetchQueries({ queryKey: getGetBalanceQueryKey() }).then(() => {
          setBaseOffset(0); setQuoteOffset(0);
        });
        setPct(0); setAmountInput(""); setConfirmOpen(false);
        promptIfNeeded("order");
      },
      onError: () => { setBaseOffset(0); setQuoteOffset(0); setConfirmOpen(false); },
    };
    if (isBuy) buyMutation.mutate(payload, options);
    else       sellMutation.mutate(payload, options);
  };

  const slippageColor = impact.slippage > 3 ? "text-danger" : impact.slippage > 1 ? "text-yellow-400" : "text-success";
  const LIMIT_PRESETS = [0.5, 1, 2, 5, 10];

  return (
    <div className="flex flex-col h-full p-4">
      {/* BUY / SELL — underline tabs */}
      <div className="flex gap-5 border-b border-white/[0.04] mb-4">
        {(["buy", "sell"] as const).map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => handleTabChange(side)}
            className={cn(
              "pb-2.5 text-xs font-bold uppercase transition-all border-b-2 -mb-px tracking-wide",
              tab === side && side === "buy"  ? "text-success border-success" :
              tab === side && side === "sell" ? "text-danger border-danger" :
              "text-muted-foreground/40 border-transparent hover:text-muted-foreground"
            )}
          >
            {side === "buy" ? `Buy ${baseCurrency}` : `Sell ${baseCurrency}`}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pb-2.5">
          {(["market", "limit"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleOrderTypeChange(type)}
              className={cn(
                "text-[10px] font-semibold transition-all",
                orderType === type ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Balance + price row */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">
            {isBuy ? `Available (${quoteCurrency})` : `Available (${baseCurrency})`}
          </p>
          <p className={cn("font-mono font-semibold tabular-nums", isBuy ? "text-success" : "text-danger")}>
            {formatCrypto(isBuy ? quoteBalance : baseBalance)}
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">
            {isLimit ? "Limit Price" : "Market Price"}
          </p>
          <p className="font-mono font-semibold tabular-nums text-foreground">
            {executionPrice > 0 ? formatCrypto(executionPrice, 6) : "—"}
            <span className="text-muted-foreground/50 ml-1 text-[10px]">{quoteCurrency}</span>
          </p>
        </div>
      </div>

      {/* LIMIT MODE: % offset picker */}
      {isLimit && marketPrice > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold">
              {isBuy ? "% below market" : "% above market"}
            </span>
            <span className={cn("text-[10px] font-mono font-bold", isBuy ? "text-success" : "text-danger")}>
              {limitOffsetPct}%
            </span>
          </div>
          <div className="flex gap-1">
            {LIMIT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setLimitOffsetPct(p)}
                className={cn(
                  "flex-1 py-1 text-[10px] font-bold rounded transition-all",
                  limitOffsetPct === p
                    ? isBuy ? "text-success border-b border-success" : "text-danger border-b border-danger"
                    : "text-muted-foreground/40 hover:text-muted-foreground"
                )}
              >
                {p}%
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center">
            Limit: <span className={cn("font-mono font-bold", isBuy ? "text-success" : "text-danger")}>{formatCrypto(limitPrice, 6)} {quoteCurrency}</span>
          </p>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); if (amount > 0 && executionPrice > 0) setConfirmOpen(true); }} className="space-y-3 flex-1">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-1.5">
            Amount ({baseCurrency})
          </p>
          <Input
            type="number" step="any" min="0" placeholder="0.000000"
            suffix={baseCurrency} value={amountInput} onChange={handleAmountChange}
            className="font-mono text-sm h-9"
          />
        </div>

        {/* Pct quick links */}
        <div className="flex gap-3">
          {[25, 50, 75, 100].map((p) => (
            <button
              key={p} type="button" onClick={() => handleSliderChange(p)}
              className={cn(
                "text-[10px] font-semibold transition-all flex-1 text-center",
                pct === p
                  ? isBuy ? "text-success" : "text-danger"
                  : "text-muted-foreground/40 hover:text-muted-foreground"
              )}
            >{p === 100 ? "MAX" : `${p}%`}</button>
          ))}
        </div>

        {/* Market impact */}
        {!isLimit && amount > 0 && marketPrice > 0 && (
          <div className="space-y-1 pt-1 border-t border-white/[0.04]">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground/50">{isBuy ? "You spend" : "You receive"}</span>
              <span className="font-mono text-foreground tabular-nums">{formatCrypto(impact.totalQuote, 4)} {quoteCurrency}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground/50">Avg. Fill</span>
              <span className="font-mono text-foreground tabular-nums">{formatCrypto(impact.avgPrice, 6)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground/50">Slippage</span>
              <span className={cn("font-mono font-semibold", slippageColor)}>
                {impact.slippage < 0.01 ? "< 0.01%" : `${impact.slippage.toFixed(3)}%`}
              </span>
            </div>
            {impact.partialFill && (
              <p className="text-yellow-400 text-[10px] font-medium">⚠ Partial fill — insufficient liquidity</p>
            )}
          </div>
        )}

        {isLimit && amount > 0 && limitPrice > 0 && (
          <div className="space-y-1 pt-1 border-t border-white/[0.04]">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground/50">{isBuy ? "Max cost" : "Min received"}</span>
              <span className="font-mono text-foreground tabular-nums">{formatCrypto(totalCost, 4)} {quoteCurrency}</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="text-danger text-[11px] font-semibold text-center py-1.5 border border-danger/20 rounded bg-danger/5">{errorMsg}</div>
        )}

        <button
          type="submit"
          disabled={isPending || amount <= 0 || executionPrice <= 0}
          className={cn(
            "w-full h-9 rounded text-xs font-bold transition-all disabled:opacity-40 mt-auto",
            isBuy
              ? "bg-success/10 border border-success/30 text-success hover:bg-success hover:text-background"
              : "bg-danger/10 border border-danger/30 text-danger hover:bg-danger hover:text-foreground"
          )}
        >
          {isPending ? "Processing…" : isLimit
            ? (isBuy ? `Place Limit Buy` : `Place Limit Sell`)
            : (isBuy ? `Market Buy ${baseCurrency}` : `Market Sell ${baseCurrency}`)}
        </button>
      </form>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-xs border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className={cn("text-base", isBuy ? "text-success" : "text-danger")}>
              Confirm {isBuy ? "Buy" : "Sell"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="divide-y divide-white/[0.04] text-xs">
              {[
                ["Type", orderType],
                ["Side", tab],
                ["Amount", `${formatCrypto(amount)} ${baseCurrency}`],
                [isLimit ? "Limit price" : "Est. price", `${formatCrypto(executionPrice, 6)} ${quoteCurrency}`],
                [isBuy ? "Total cost" : "Total received", `${formatCrypto(totalCost, 4)} ${quoteCurrency}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono font-semibold">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => setConfirmOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <button
                onClick={doSubmit}
                disabled={isPending}
                className={cn(
                  "flex-1 h-8 rounded text-xs font-bold transition-all disabled:opacity-40",
                  isBuy
                    ? "bg-success text-background hover:bg-success/80"
                    : "bg-danger text-foreground hover:bg-danger/80"
                )}
              >
                {isPending ? "Processing…" : "Confirm"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MyOpenOrders() {
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, refetch } = useGetOrders(
    { status: "open" },
    { query: { refetchInterval: 10000 } }
  );
  const cancelMutation = useCancelOrder();

  const orders = data?.orders ?? [];

  const handleCancel = (orderId: number) => {
    cancelMutation.mutate({ orderId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBalanceQueryKey() });
      },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-semibold">My Open Orders</p>
          {orders.length > 0 && (
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
              {orders.length}
            </span>
          )}
          <span className={cn("flex items-center gap-1 text-[9px]", isFetching ? "text-primary" : "text-success/50")}>
            <span className={cn("w-1 h-1 rounded-full", isFetching ? "bg-primary animate-pulse" : "bg-success/40")} />
            {isFetching ? "syncing" : "live"}
          </span>
        </div>
        <button
          onClick={() => refetch()}
          className="text-muted-foreground/30 hover:text-muted-foreground transition-colors"
        >
          <RefreshCw className={cn("w-3 h-3", isFetching && "animate-spin")} />
        </button>
      </div>

      {isLoading ? (
        <p className="py-4 text-center text-xs text-muted-foreground">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="py-8 flex flex-col items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-muted/50 border border-white/[0.04] flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-muted-foreground/30" />
          </div>
          <p className="text-xs text-muted-foreground/50">No open orders</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.03]">
          {orders.map((o) => (
            <div key={o.orderId} className="flex items-center gap-3 py-2 group">
              <Badge variant={o.task === "buy" ? "success" : "destructive"} className="shrink-0">
                {o.task}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold font-sans uppercase">{o.cur}/{o.ecur}</p>
                <p className={cn("font-mono text-[11px] tabular-nums", o.task === "buy" ? "text-success" : "text-danger")}>
                  {formatCrypto(o.price)} <span className="text-muted-foreground/50">× {formatCrypto(o.amount)}</span>
                </p>
              </div>
              <button
                onClick={() => handleCancel(o.orderId)}
                disabled={cancelMutation.isPending}
                className="text-muted-foreground/20 hover:text-danger transition-colors disabled:opacity-40 opacity-0 group-hover:opacity-100"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TradeHistoryList({ pair }: { pair: string }) {
  const { data } = useGetTradeHistory({ pair }, { query: { refetchInterval: 5000 } });
  const quoteCurrency = pair.split("_")[1]?.toUpperCase() ?? "";
  const baseCurrency  = pair.split("_")[0]?.toUpperCase() ?? "";

  return (
    <div>
      <div className="grid grid-cols-4 px-0 pb-1.5 border-b border-white/[0.04] text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold mb-1">
        <span>Side</span>
        <span className="text-right">Price ({quoteCurrency})</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Time</span>
      </div>
      <div className="h-[200px] overflow-y-auto font-mono text-[11px] space-y-[1px]">
        {data?.items.slice(0, 100).map((trade, i) => (
          <div
            key={trade.recordId || i}
            className="grid grid-cols-4 py-[3px] hover:bg-white/[0.02] transition-colors"
          >
            <span
              className={cn(
                "font-bold uppercase text-[9px]",
                trade.recordType === "buy" ? "text-success" : "text-danger"
              )}
            >
              {trade.recordType}
            </span>
            <span className={cn("text-right font-semibold tabular-nums", trade.recordType === "buy" ? "text-success" : "text-danger")}>
              {formatCrypto(trade.price, 6)}
            </span>
            <span className="text-right text-muted-foreground/60 tabular-nums">{formatCrypto(trade.amount, 4)}</span>
            <span className="text-right text-muted-foreground/40">{formatTime(trade.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Trade() {
  const [location, setLocation] = useLocation();
  const pathPair = location.replace("/trade/", "").replace("/trade", "");
  const { data: pairsData } = useGetTradingPairs({ query: { refetchInterval: 30000 } });
  const pairs = pairsData?.pairs ?? [];

  const currentPair = useMemo(() => {
    if (pathPair && pairs.some(p => p.pair === pathPair)) return pathPair;
    const saved = (() => { try { return localStorage.getItem(LAST_PAIR_KEY); } catch { return null; } })();
    if (saved && pairs.some(p => p.pair === saved)) return saved;
    return pairs[0]?.pair ?? "crp_usdt";
  }, [pathPair, pairs]);

  const handlePairSelect = (pair: string) => {
    try { localStorage.setItem(LAST_PAIR_KEY, pair); } catch {}
    setLocation(`/trade/${pair}`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full gap-0">
      {/* ── Ticker bar ── */}
      <Card className="mb-3 rounded-lg border-white/[0.04] relative z-20">
        <TickerSummary pair={currentPair} onPairSelect={handlePairSelect} />
      </Card>

      {/* ── Mobile: stacked vertical scroll ── */}
      <div className="md:hidden flex flex-col gap-3 pb-20">
        <Card className="border-white/[0.04] overflow-hidden">
          <TradeChart pair={currentPair} />
        </Card>
        <Card className="border-white/[0.04] overflow-hidden">
          <OrderEntry pair={currentPair} />
        </Card>
        <Card className="border-white/[0.04] p-4">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold mb-3">Order Book</p>
          <OrderBook pair={currentPair} compact />
        </Card>
        <Card className="border-white/[0.04] p-4 space-y-3">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold">Recent Trades</p>
          <TradeHistoryList pair={currentPair} />
        </Card>
        <Card className="border-white/[0.04] p-4">
          <MyOpenOrders />
        </Card>
      </div>

      {/* ── Desktop: full layout ── */}
      <DesktopTradeLayout currentPair={currentPair} />
    </motion.div>
  );
}

function DesktopTradeLayout({ currentPair }: { currentPair: string }) {
  const [panelOrder, setPanelOrder] = useState<PanelId[]>(getStoredPanelOrder);
  const [reorderMode, setReorderMode] = useState(false);
  const [panelWidths, setPanelWidths] = useState<[number, number, number]>(getStoredPanelWidths);
  const panelWidthsRef = useRef(panelWidths);
  panelWidthsRef.current = panelWidths;
  const containerRef = useRef<HTMLDivElement>(null);

  const handleReorder = useCallback((newOrder: PanelId[]) => {
    setPanelOrder(newOrder);
    savePanelOrder(newOrder);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent, handleIdx: number) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidths = [...panelWidthsRef.current] as [number, number, number];
    const MIN_W = 15;

    const onMove = (me: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const totalW = container.offsetWidth;
      const dPct = ((me.clientX - startX) / totalW) * 100;
      const newWidths = [...startWidths] as [number, number, number];
      newWidths[handleIdx]     = Math.max(MIN_W, Math.min(startWidths[handleIdx] + dPct, startWidths[handleIdx] + startWidths[handleIdx + 1] - MIN_W));
      newWidths[handleIdx + 1] = startWidths[handleIdx] + startWidths[handleIdx + 1] - newWidths[handleIdx];
      setPanelWidths(newWidths);
      panelWidthsRef.current = newWidths;
    };

    const onUp = () => {
      savePanelWidths(panelWidthsRef.current);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  }, []);

  const renderPanel = (id: PanelId) => {
    switch (id) {
      case "trades":
        return (
          <Card className="border-white/[0.04] p-4 space-y-3 h-full">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold">Recent Trades</p>
            <TradeHistoryList pair={currentPair} />
          </Card>
        );
      case "book":
        return (
          <Card className="border-white/[0.04] p-4 h-full">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold mb-3">Order Book</p>
            <div className="h-[260px]">
              <OrderBook pair={currentPair} />
            </div>
          </Card>
        );
      case "entry":
        return (
          <Card className="border-white/[0.04] overflow-hidden flex flex-col h-full">
            <OrderEntry pair={currentPair} />
          </Card>
        );
    }
  };

  return (
    <div className="hidden md:flex flex-col gap-3 flex-1 min-h-0">
      <Card className="border-white/[0.04] overflow-hidden">
        <TradeChart pair={currentPair} />
      </Card>

      <div className="flex items-center justify-end">
        <button
          onClick={() => setReorderMode(v => !v)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all",
            reorderMode
              ? "bg-primary/15 text-primary border border-primary/25"
              : "text-muted-foreground/50 hover:text-muted-foreground border border-transparent hover:border-white/[0.06]"
          )}
        >
          <Settings2 className="w-3 h-3" />
          {reorderMode ? "Done" : "Customize"}
        </button>
      </div>

      {reorderMode ? (
        <Reorder.Group
          axis="x"
          values={panelOrder}
          onReorder={handleReorder}
          className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-3"
        >
          {panelOrder.map((id) => (
            <DraggablePanel key={id} id={id} reorderMode>
              {renderPanel(id)}
            </DraggablePanel>
          ))}
        </Reorder.Group>
      ) : (
        <div ref={containerRef} className="hidden md:flex items-stretch min-h-0">
          {panelOrder.map((id, idx) => (
            [
              <div
                key={id}
                style={{ width: `${panelWidths[idx]}%`, minWidth: 0 }}
                className="flex flex-col min-w-0"
              >
                {renderPanel(id)}
              </div>,
              idx < panelOrder.length - 1 && (
                <div
                  key={`handle-${idx}`}
                  onMouseDown={(e) => handleResizeStart(e, idx)}
                  className="w-3 flex-shrink-0 flex items-center justify-center cursor-col-resize group relative z-10"
                  title="Drag to resize"
                >
                  <div className="w-px h-full bg-white/[0.04] group-hover:bg-primary/40 transition-colors duration-150" />
                </div>
              )
            ]
          ))}
        </div>
      )}

      <Card className="border-white/[0.04] p-4">
        <MyOpenOrders />
      </Card>
    </div>
  );
}
