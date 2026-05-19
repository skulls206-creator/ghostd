import { useState, useRef, useEffect } from "react";
import { Zap, X, ChevronDown, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useGetTradingPairs } from "@/api";

const LAST_PAIR_KEY = "crp_last_pair";

// Lazy import the full OrderEntry — we re-export a wrapper here
// that embeds the Trade page's order entry panel in a floating sheet.
// Since OrderEntry is not exported, we inline a minimal version here.
import {
  useGetOrderBook,
  useGetBalance,
  usePlaceBuyOrder,
  usePlaceSellOrder,
  getGetOrdersQueryKey,
  getGetBalanceQueryKey,
} from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "@/hooks/useNotifications";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCrypto } from "@/lib/utils";
import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function MiniOrderEntry({ pair, onClose }: { pair: string; onClose: () => void }) {
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [pct, setPct] = useState(0);
  const [amountInput, setAmountInput] = useState("");
  const [baseOffset, setBaseOffset] = useState(0);
  const [quoteOffset, setQuoteOffset] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const queryClient = useQueryClient();
  const buyMutation = usePlaceBuyOrder();
  const sellMutation = usePlaceSellOrder();
  const { promptIfNeeded } = useNotifications();
  const { data: balanceData } = useGetBalance({ query: { queryKey: ["q"], refetchInterval: 8000 } });
  const { data: bookData } = useGetOrderBook({ pair }, { query: { queryKey: ["q"], refetchInterval: 3000 } });

  const baseCurrency = pair.split("_")[0]?.toUpperCase() ?? "";
  const quoteCurrency = pair.split("_")[1]?.toUpperCase() ?? "";
  const isBuy = tab === "buy";

  const asks = bookData?.asks ?? [];
  const bids = bookData?.bids ?? [];

  const rawBaseBalance = balanceData?.balances.find(b => b.currency.name.toLowerCase() === pair.split("_")[0])?.balance ?? 0;
  const rawQuoteBalance = balanceData?.balances.find(b => b.currency.name.toLowerCase() === pair.split("_")[1])?.balance ?? 0;
  const baseBalance = Math.max(0, rawBaseBalance + baseOffset);
  const quoteBalance = Math.max(0, rawQuoteBalance + quoteOffset);

  const sortedAsks = [...asks].sort((a, b) => a.price - b.price);
  const sortedBids = [...bids].sort((a, b) => b.price - a.price);
  const marketPrice = isBuy ? (sortedAsks[0]?.price ?? 0) : (sortedBids[0]?.price ?? 0);

  const maxBase = isBuy ? (marketPrice > 0 ? quoteBalance / marketPrice : 0) : baseBalance;
  const sliderAmount = (pct / 100) * maxBase;
  const parsedInput = parseFloat(amountInput);
  const amount = amountInput !== "" && !isNaN(parsedInput) && parsedInput > 0 ? parsedInput : sliderAmount;
  const totalCost = amount * marketPrice;

  const isPending = buyMutation.isPending || sellMutation.isPending;
  const errorMsg = (buyMutation.error as any)?.["error"] || (sellMutation.error as any)?.["error"];

  const handleSlider = (v: number) => {
    setPct(v);
    const newAmount = (v / 100) * maxBase;
    setAmountInput(newAmount > 0 ? newAmount.toFixed(6) : "");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountInput(e.target.value);
    const p = parseFloat(e.target.value);
    if (!isNaN(p) && maxBase > 0) setPct(Math.min(100, Math.round((p / maxBase) * 100)));
  };

  const doSubmit = () => {
    if (amount <= 0 || marketPrice <= 0) return;
    if (isBuy) setQuoteOffset(p => p - amount * marketPrice);
    else setBaseOffset(p => p - amount);

    const payload = { data: { pair, amount, price: marketPrice } };
    const options = {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
        queryClient.refetchQueries({ queryKey: getGetBalanceQueryKey() }).then(() => {
          setBaseOffset(0); setQuoteOffset(0);
        });
        setPct(0); setAmountInput(""); setConfirm(false);
        promptIfNeeded("order");
        onClose();
      },
      onError: () => { setBaseOffset(0); setQuoteOffset(0); setConfirm(false); },
    };
    if (isBuy) buyMutation.mutate(payload, options);
    else sellMutation.mutate(payload, options);
  };

  return (
    <div className="space-y-4">
      <div className="flex bg-background border border-border p-1 rounded-xl">
        {(["buy", "sell"] as const).map(side => (
          <button
            key={side}
            type="button"
            onClick={() => { setTab(side); setPct(0); setAmountInput(""); }}
            className={cn(
              "flex-1 py-2.5 text-sm rounded-lg font-bold transition-all capitalize",
              tab === side && side === "buy" ? "bg-success text-success-foreground shadow-success/20 shadow-lg" :
              tab === side && side === "sell" ? "bg-danger text-danger-foreground shadow-danger/20 shadow-lg" :
              "text-muted-foreground hover:text-foreground"
            )}
          >
            {side === "buy" ? `Buy ${baseCurrency}` : `Sell ${baseCurrency}`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className={cn("flex flex-col px-3 py-2 rounded-lg border", isBuy ? "bg-success/5 border-success/20" : "bg-danger/5 border-danger/20")}>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Balance</span>
          <span className={cn("font-mono font-bold text-sm", isBuy ? "text-success" : "text-danger")}>
            {formatCrypto(isBuy ? quoteBalance : baseBalance)} {isBuy ? quoteCurrency : baseCurrency}
          </span>
        </div>
        <div className="flex flex-col px-3 py-2 rounded-lg border border-border/50 bg-muted/10">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Market Price</span>
          <span className="font-mono font-bold text-sm">{marketPrice > 0 ? formatCrypto(marketPrice, 6) : "—"} <span className="text-xs text-muted-foreground">{quoteCurrency}</span></span>
        </div>
      </div>

      <div>
        <Input
          type="number"
          step="any"
          min="0"
          placeholder="0.000000"
          suffix={baseCurrency}
          value={amountInput}
          onChange={handleAmountChange}
        />
      </div>

      <div>
        <div className="flex gap-1.5 mb-2">
          {[25, 50, 75, 100].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => handleSlider(p)}
              className={cn(
                "flex-1 py-1 text-xs font-bold rounded-md border transition-all",
                pct === p
                  ? isBuy ? "bg-success/20 border-success/40 text-success" : "bg-danger/20 border-danger/40 text-danger"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >{p}%</button>
          ))}
        </div>
        <div className="relative h-5 flex items-center">
          <div className="absolute inset-x-0 h-1.5 rounded-full bg-border" />
          <div className={cn("absolute left-0 h-1.5 rounded-full", isBuy ? "bg-success" : "bg-danger")} style={{ width: `${pct}%` }} />
          <input
            type="range" min={0} max={100} step={1} value={pct}
            onChange={e => handleSlider(Number(e.target.value))}
            className="relative w-full h-1.5 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary"
          />
        </div>
      </div>

      {amount > 0 && marketPrice > 0 && (
        <div className="text-xs text-muted-foreground font-mono text-center border border-border/40 rounded-lg py-2 bg-muted/10">
          {isBuy ? "Spending" : "Receiving"} ≈ <span className="font-bold text-foreground">{formatCrypto(totalCost, 4)} {quoteCurrency}</span>
        </div>
      )}

      {errorMsg && (
        <div className="text-danger text-sm font-semibold text-center bg-danger/10 p-2 rounded-lg">{errorMsg}</div>
      )}

      {!confirm ? (
        <Button
          onClick={() => amount > 0 && marketPrice > 0 && setConfirm(true)}
          disabled={amount <= 0 || marketPrice <= 0}
          className={cn("w-full py-5 text-sm shadow-xl",
            isBuy ? "bg-success hover:bg-success/90 shadow-success/20" : "bg-danger hover:bg-danger/90 shadow-danger/20"
          )}
        >
          {isBuy ? `Buy ${baseCurrency}` : `Sell ${baseCurrency}`}
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Order</span><span className="font-bold">{isBuy ? "Buy" : "Sell"} {formatCrypto(amount)} {baseCurrency}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">At price</span><span className="font-mono">{formatCrypto(marketPrice, 6)} {quoteCurrency}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{isBuy ? "Total cost" : "Total received"}</span><span className="font-mono font-bold">{formatCrypto(totalCost, 4)} {quoteCurrency}</span></div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirm(false)} disabled={isPending}>Cancel</Button>
            <Button
              className={cn("flex-1", isBuy ? "bg-success hover:bg-success/90" : "bg-danger hover:bg-danger/90")}
              onClick={doSubmit}
              disabled={isPending}
            >
              {isPending ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function QuickTrade() {
  const [open, setOpen] = useState(false);
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const [location] = useLocation();
  const { data: pairsData } = useGetTradingPairs({});
  const savedPair = (() => { try { return localStorage.getItem(LAST_PAIR_KEY); } catch { return null; } })();

  const allPairs = useMemo(() =>
    (pairsData?.pairs ?? []).map((p: any) => p.pair as string),
    [pairsData]
  );

  const pair = selectedPair || savedPair || allPairs[0] || "crp_usdt";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const handlePairChange = (p: string) => {
    setSelectedPair(p);
    setDropdownOpen(false);
    try { localStorage.setItem(LAST_PAIR_KEY, p); } catch {}
  };

  if (location.startsWith("/trade")) return null;

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 right-4 z-50 md:bottom-8 md:right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <Zap className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Quick Trade
            </DialogTitle>
          </DialogHeader>

          {allPairs.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(v => !v)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
              >
                <span className="text-sm font-semibold font-mono tracking-wide text-foreground">
                  {pair.replace("_", " / ").toUpperCase()}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", dropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-50 top-full left-0 right-0 mt-1.5 rounded-lg border border-white/[0.08] bg-popover shadow-xl shadow-black/40 overflow-hidden"
                  >
                    <div className="max-h-48 overflow-y-auto py-1">
                      {allPairs.map((p) => {
                        const active = p === pair;
                        return (
                          <button
                            key={p}
                            onClick={() => handlePairChange(p)}
                            className={cn(
                              "w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-mono tracking-wide transition-colors",
                              active
                                ? "bg-primary/10 text-primary font-bold"
                                : "text-foreground/80 hover:bg-white/[0.05] hover:text-foreground"
                            )}
                          >
                            {active && <Check className="w-3.5 h-3.5 shrink-0 absolute left-3" />}
                            <span>{p.replace("_", " / ").toUpperCase()}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <MiniOrderEntry pair={pair} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
