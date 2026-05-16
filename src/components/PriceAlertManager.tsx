import { useState } from "react";
import { Bell, Trash2, Plus, X, BellOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCrypto } from "@/lib/utils";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { useNotifications } from "@/hooks/useNotifications";
import { useGetTicker } from "@/api";
import { formatDate } from "@/lib/utils";

interface PriceAlertManagerProps {
  alerts: ReturnType<typeof usePriceAlerts>["alerts"];
  addAlert: ReturnType<typeof usePriceAlerts>["addAlert"];
  removeAlert: ReturnType<typeof usePriceAlerts>["removeAlert"];
  clearTriggered: ReturnType<typeof usePriceAlerts>["clearTriggered"];
  activeCount: number;
  expanded?: boolean;
}

export function PriceAlertButton({ activeCount, onClick, expanded }: { activeCount: number; onClick: () => void; expanded?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all",
        expanded ? "w-full px-2.5 h-9 gap-2.5" : "w-9 h-9 justify-center"
      )}
    >
      <Bell className="w-4 h-4 shrink-0" />
      {expanded && <span className="text-xs font-medium whitespace-nowrap">Price Alerts</span>}
      {activeCount > 0 && (
        <span className={cn(
          "w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center leading-none",
          expanded ? "ml-auto" : "absolute -top-0.5 -right-0.5"
        )}>
          {activeCount > 9 ? "9+" : activeCount}
        </span>
      )}
    </button>
  );
}

export function PriceAlertManager({ alerts, addAlert, removeAlert, clearTriggered, activeCount, expanded }: PriceAlertManagerProps) {
  const [open, setOpen] = useState(false);
  const [pair, setPair] = useState("crp_usdt");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [targetInput, setTargetInput] = useState("");
  const { data: tickers } = useGetTicker({});
  const { promptIfNeeded } = useNotifications();

  const activePairs = tickers?.filter(t => t.enable).map(t => t.pair) ?? [];
  const currentPrice = tickers?.find(t => t.pair === pair)?.lastPrice;

  const handleAdd = () => {
    const price = parseFloat(targetInput);
    if (!pair || !price || price <= 0) return;
    addAlert(pair, direction, price);
    setTargetInput("");
    promptIfNeeded("alert");
  };

  const setFromMarket = (pct: number) => {
    if (!currentPrice) return;
    const price = currentPrice * (1 + pct / 100);
    setTargetInput(price.toFixed(6));
  };

  const triggered = alerts.filter(a => a.triggered);
  const active = alerts.filter(a => !a.triggered);

  return (
    <>
      <PriceAlertButton activeCount={activeCount} onClick={() => setOpen(true)} expanded={expanded} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" /> Price Alerts
            </DialogTitle>
          </DialogHeader>

          {/* Add new alert */}
          <div className="space-y-3 border border-border/50 rounded-xl p-4 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Alert</p>

            {/* Pair selector */}
            <select
              value={pair}
              onChange={e => setPair(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-semibold uppercase focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {activePairs.map(p => (
                <option key={p} value={p}>{p.replace("_", "/").toUpperCase()}</option>
              ))}
            </select>

            {/* Direction */}
            <div className="flex bg-background border border-border p-1 rounded-xl">
              {(["above", "below"] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={cn(
                    "flex-1 py-2 text-sm rounded-lg font-bold transition-all capitalize",
                    direction === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Price input */}
            <div>
              <Input
                type="number"
                step="any"
                placeholder="Target price..."
                value={targetInput}
                onChange={e => setTargetInput(e.target.value)}
                suffix={pair.split("_")[1]?.toUpperCase()}
              />
              {currentPrice && (
                <div className="mt-2">
                  <p className="text-[10px] text-muted-foreground mb-1.5">Quick set relative to current ({formatCrypto(currentPrice, 6)}):</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {(direction === "above" ? [1, 2, 5, 10] : [-1, -2, -5, -10]).map(pct => (
                      <button
                        key={pct}
                        onClick={() => setFromMarket(pct)}
                        className="px-2 py-1 text-xs font-semibold rounded-md border border-border hover:border-primary hover:text-primary transition-colors"
                      >
                        {pct > 0 ? "+" : ""}{pct}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button onClick={handleAdd} className="w-full" disabled={!targetInput || parseFloat(targetInput) <= 0}>
              <Plus className="w-4 h-4 mr-2" /> Set Alert
            </Button>
          </div>

          {/* Active alerts */}
          {active.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active ({active.length})</p>
              {active.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card/50">
                  <div>
                    <p className="font-bold text-sm uppercase">{a.pair.replace("_", "/").toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      Price goes <span className={a.direction === "above" ? "text-success" : "text-danger"}>{a.direction}</span>{" "}
                      <span className="font-mono font-semibold text-foreground">{formatCrypto(a.targetPrice, 6)}</span>
                    </p>
                  </div>
                  <button onClick={() => removeAlert(a.id)} className="text-muted-foreground hover:text-danger transition-colors p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Triggered alerts */}
          {triggered.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Triggered ({triggered.length})</p>
                <button onClick={clearTriggered} className="text-xs text-muted-foreground hover:text-danger transition-colors flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear all
                </button>
              </div>
              {triggered.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-muted/10 opacity-60">
                  <div>
                    <p className="font-bold text-sm uppercase">{a.pair.replace("_", "/").toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      Triggered {a.triggeredAt ? formatDate(a.triggeredAt) : ""}
                    </p>
                  </div>
                  <button onClick={() => removeAlert(a.id)} className="text-muted-foreground hover:text-danger transition-colors p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {alerts.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <BellOff className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No alerts set yet.</p>
              <p className="text-xs mt-1">Set an alert above and get notified when a price hits your target.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
