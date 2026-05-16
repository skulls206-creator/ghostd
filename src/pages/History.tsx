import { apiFetch } from "@/lib/apiFetch";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatCrypto, formatDate, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, DollarSign, ClipboardList, Copy, TrendingUp } from "lucide-react";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuLabel, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useClipboard } from "@/hooks/useClipboard";
import { useLocation } from "wouter";

interface MyOrder {
  orderId: number;
  pair: string;
  type: string;
  status: string;
  price: number;
  priceExecuted: number;
  origAmount: number;
  origValue: number;
  valueExecuted: number;
  dateReg: number;
}

interface Transaction {
  recordType: string;
  currency: string;
  amount: number;
  balance: number;
  paymentId: number;
  txId: string;
  status: string;
  address: string;
  createdAt: number;
}

function useMyOrders() {
  return useQuery<{ orders: MyOrder[]; total: number }>({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const r = await apiFetch("/api/history/my-orders");
      if (!r.ok) throw new Error("Failed to fetch orders");
      return r.json();
    },
    refetchInterval: 30000,
  });
}

function useTransactions() {
  return useQuery<{ transactions: Transaction[] }>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const r = await apiFetch("/api/history/transactions");
      if (!r.ok) throw new Error("Failed to fetch transactions");
      return r.json();
    },
    refetchInterval: 30000,
  });
}

const STATUS_STYLES: Record<string, string> = {
  close:   "bg-success/10 text-success",
  open:    "bg-primary/10 text-primary",
  hold:    "bg-yellow-500/10 text-yellow-400",
  cancel:  "bg-white/[0.06] text-muted-foreground",
  success: "bg-success/10 text-success",
  pending: "bg-yellow-500/10 text-yellow-400",
  failed:  "bg-danger/10 text-danger",
};

const TX_ICON: Record<string, React.ReactNode> = {
  deposit:    <ArrowDownToLine className="w-3 h-3" />,
  withdraw:   <ArrowUpFromLine className="w-3 h-3" />,
  buy:        <ArrowRightLeft className="w-3 h-3" />,
  sell:       <ArrowRightLeft className="w-3 h-3" />,
  commission: <DollarSign className="w-3 h-3" />,
};

const TX_COLOR: Record<string, string> = {
  deposit:    "text-success bg-success/10",
  withdraw:   "text-danger bg-danger/10",
  buy:        "text-primary bg-primary/10",
  sell:       "text-orange-400 bg-orange-400/10",
  commission: "text-muted-foreground bg-white/[0.06]",
};

function MyOrdersTab() {
  const { data, isLoading, error } = useMyOrders();
  const orders = data?.orders ?? [];
  const { copy } = useClipboard();
  const [, navigate] = useLocation();

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 font-semibold border-b border-white/[0.04]">
              <th className="py-2 pl-1 pr-4">Date</th>
              <th className="py-2 px-4">Pair</th>
              <th className="py-2 px-4">Type</th>
              <th className="py-2 px-4">Status</th>
              <th className="py-2 px-4 text-right">Price</th>
              <th className="py-2 px-4 text-right">Amount</th>
              <th className="py-2 pl-4 pr-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[11px]">
            {isLoading ? (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground font-sans text-xs">Loading orders…</td></tr>
            ) : error ? (
              <tr><td colSpan={7} className="py-12 text-center text-danger font-sans text-xs">Failed to load orders.</td></tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center font-sans">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted/50 border border-white/[0.04] flex items-center justify-center">
                      <svg className="w-6 h-6 text-muted-foreground/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground/60">No orders found</p>
                      <p className="text-[11px] text-muted-foreground/30 mt-0.5">Your completed and cancelled orders will appear here</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : orders.map((o) => (
              <ContextMenu key={o.orderId}>
                <ContextMenuTrigger asChild>
                  <tr className="h-9 hover:bg-white/[0.02] transition-colors border-b border-white/[0.02]">
                    <td className="py-2 pl-1 pr-4 text-muted-foreground/40 font-sans text-[10px]">{formatDate(o.dateReg)}</td>
                    <td className="py-2 px-4 font-semibold uppercase text-[10px] tracking-wide">{o.pair.replace("_", " / ")}</td>
                    <td className="py-2 px-4 font-sans">
                      <Badge variant={o.type === "buy" ? "success" : "destructive"}>
                        {o.type}
                      </Badge>
                    </td>
                    <td className="py-2 px-4 font-sans">
                      <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide", STATUS_STYLES[o.status] ?? "bg-white/[0.06] text-muted-foreground")}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums">{formatCrypto(o.priceExecuted || o.price)}</td>
                    <td className="py-2 px-4 text-right tabular-nums text-foreground/60">{formatCrypto(o.origAmount)}</td>
                    <td className="py-2 pl-4 pr-1 text-right font-semibold text-foreground tabular-nums">{formatCrypto(o.valueExecuted || o.origValue)}</td>
                  </tr>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Order #{o.orderId}
                  </ContextMenuLabel>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => navigate(`/trade/${o.pair}`)}>
                    <TrendingUp className="w-3.5 h-3.5 mr-2 text-primary" /> Trade this pair
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => copy(String(o.orderId), "Order ID copied")}>
                    <Copy className="w-3.5 h-3.5 mr-2" /> Copy order ID
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => copy(String(o.priceExecuted || o.price), "Price copied")}>
                    <Copy className="w-3.5 h-3.5 mr-2" /> Copy price
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-white/[0.03]">
        {isLoading ? (
          <p className="py-6 text-center text-muted-foreground text-xs">Loading orders…</p>
        ) : orders.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted/50 border border-white/[0.04] flex items-center justify-center">
              <svg className="w-6 h-6 text-muted-foreground/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
            </div>
            <p className="text-sm text-muted-foreground/60">No orders found</p>
          </div>
        ) : orders.map((o) => (
          <div key={o.orderId} className="px-1 py-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs uppercase">{o.pair.replace("_", " / ")}</span>
              <span className="text-[10px] text-muted-foreground/40">{formatDate(o.dateReg)}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={o.type === "buy" ? "success" : "destructive"}>{o.type}</Badge>
              <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase", STATUS_STYLES[o.status] ?? "bg-white/[0.06] text-muted-foreground")}>
                {o.status}
              </span>
              <span className="font-mono text-xs ml-auto font-semibold tabular-nums">{formatCrypto(o.valueExecuted || o.origValue)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function TransactionsTab() {
  const { data, isLoading, error } = useTransactions();
  const txs = (data?.transactions ?? []).filter(t => t.recordType !== "commission" || t.amount !== 0);
  const { copy } = useClipboard();

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 font-semibold border-b border-white/[0.04]">
              <th className="py-2 pl-1 pr-4">Date</th>
              <th className="py-2 px-4">Type</th>
              <th className="py-2 px-4">Currency</th>
              <th className="py-2 px-4 text-right">Amount</th>
              <th className="py-2 px-4 text-right">Balance After</th>
              <th className="py-2 px-4">Status</th>
              <th className="py-2 pl-4 pr-1">Address / TX</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[11px]">
            {isLoading ? (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground font-sans text-xs">Loading…</td></tr>
            ) : error ? (
              <tr><td colSpan={7} className="py-12 text-center text-danger font-sans text-xs">Failed to load.</td></tr>
            ) : txs.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground/40 font-sans text-xs">No transactions found.</td></tr>
            ) : txs.map((t, i) => (
              <ContextMenu key={`${t.paymentId}-${i}`}>
                <ContextMenuTrigger asChild>
                  <tr className="h-9 hover:bg-white/[0.02] transition-colors border-b border-white/[0.02]">
                    <td className="py-2 pl-1 pr-4 text-muted-foreground/40 font-sans text-[10px]">{formatDate(t.createdAt)}</td>
                    <td className="py-2 px-4 font-sans">
                      <span className={cn("inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide", TX_COLOR[t.recordType] ?? "text-muted-foreground bg-white/[0.06]")}>
                        {TX_ICON[t.recordType] ?? null}
                        {t.recordType}
                      </span>
                    </td>
                    <td className="py-2 px-4 font-semibold uppercase text-[10px]">{t.currency}</td>
                    <td className={cn("py-2 px-4 text-right font-semibold tabular-nums", t.recordType === "deposit" ? "text-success" : t.recordType === "withdraw" ? "text-danger" : "text-foreground")}>
                      {t.recordType === "withdraw" ? "-" : t.recordType === "deposit" ? "+" : ""}{formatCrypto(Math.abs(t.amount))}
                    </td>
                    <td className="py-2 px-4 text-right text-muted-foreground/50 tabular-nums">{formatCrypto(t.balance)}</td>
                    <td className="py-2 px-4 font-sans">
                      <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase", STATUS_STYLES[t.status] ?? "bg-white/[0.06] text-muted-foreground")}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2 pl-4 pr-1 text-[10px] text-muted-foreground/40 truncate max-w-[160px]">
                      {t.txId ? t.txId.slice(0, 14) + "…" : t.address ? t.address.slice(0, 14) + "…" : "—"}
                    </td>
                  </tr>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {t.recordType} · {t.currency.toUpperCase()}
                  </ContextMenuLabel>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => copy(String(Math.abs(t.amount)), "Amount copied")}>
                    <Copy className="w-3.5 h-3.5 mr-2" /> Copy amount
                  </ContextMenuItem>
                  {(t.txId || t.address) ? (
                    <ContextMenuItem onClick={() => copy(t.txId || t.address || "", "TX copied")}>
                      <Copy className="w-3.5 h-3.5 mr-2" /> Copy TX / Address
                    </ContextMenuItem>
                  ) : null}
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-white/[0.03]">
        {isLoading ? (
          <p className="py-6 text-center text-muted-foreground text-xs">Loading…</p>
        ) : txs.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground/40 text-xs">No transactions found.</p>
        ) : txs.map((t, i) => (
          <div key={`${t.paymentId}-${i}`} className="px-1 py-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className={cn("inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase", TX_COLOR[t.recordType] ?? "text-muted-foreground bg-white/[0.06]")}>
                {TX_ICON[t.recordType] ?? null}
                {t.recordType}
              </span>
              <span className="text-[10px] text-muted-foreground/40">{formatDate(t.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground/60 uppercase font-semibold">{t.currency}</span>
              <span className={cn("font-mono text-sm font-bold tabular-nums", t.recordType === "deposit" ? "text-success" : t.recordType === "withdraw" ? "text-danger" : "text-foreground")}>
                {t.recordType === "withdraw" ? "-" : t.recordType === "deposit" ? "+" : ""}{formatCrypto(Math.abs(t.amount))}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

type Tab = "orders" | "transactions";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "orders",       label: "My Orders",     icon: <ClipboardList className="w-3 h-3" /> },
  { id: "transactions", label: "Transactions",  icon: <ArrowRightLeft className="w-3 h-3" /> },
];

export function History() {
  const [tab, setTab] = useState<Tab>("orders");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-foreground">History</h1>
        <p className="text-muted-foreground text-[11px] mt-0.5">Your trading and transaction records</p>
      </div>

      <div className="flex gap-5 border-b border-white/[0.04]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 pb-2.5 text-xs font-semibold transition-all border-b-2 -mb-px",
              tab === t.id
                ? "text-foreground border-primary"
                : "text-muted-foreground/40 border-transparent hover:text-muted-foreground"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "orders"       && <MyOrdersTab />}
      {tab === "transactions" && <TransactionsTab />}
    </motion.div>
  );
}
