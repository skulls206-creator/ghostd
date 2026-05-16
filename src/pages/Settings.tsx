import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTheme, THEMES } from "@/hooks/useTheme";
import { useWatchlist } from "@/hooks/useWatchlist";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { useGetTicker } from "@/api";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Palette,
  Bell,
  BellOff,
  BellRing,
  Database,
  ArrowRightLeft,
  Star,
  Trash2,
  Check,
  ChevronDown,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const LAST_PAIR_KEY    = "crp_last_pair";
const DEFAULT_TYPE_KEY = "ghostd_default_order_type";
const NOTIF_ASKED_KEY  = "ghostd_notif_asked";

function SectionHeader({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        <p className="text-[11px] text-muted-foreground/60">{description}</p>
      </div>
    </div>
  );
}

function AppearanceSection() {
  const { themeId, setTheme } = useTheme();

  return (
    <Card className="border-white/[0.04] p-5">
      <SectionHeader
        icon={<Palette className="w-4 h-4" />}
        title="Appearance"
        description="Choose the colour theme for GHOSTD"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {THEMES.map((theme) => {
          const active = themeId === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className={cn(
                "relative flex flex-col rounded-xl border-2 p-3 transition-all duration-200 text-left overflow-hidden group",
                active
                  ? "shadow-lg"
                  : "border-white/[0.06] hover:border-white/[0.15]"
              )}
              style={{
                background: theme.preview.bg,
                borderColor: active ? theme.preview.primary : undefined,
              }}
            >
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: theme.preview.primary }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: theme.preview.accent }} />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              </div>
              <div className="space-y-1">
                <div className="h-1 rounded-full w-3/4" style={{ background: theme.preview.primary, opacity: 0.6 }} />
                <div className="h-1 rounded-full w-1/2 bg-white/10" />
                <div className="h-1 rounded-full w-2/3 bg-white/[0.06]" />
              </div>
              <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] font-semibold text-white/80">{theme.name}</span>
                {active && (
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: theme.preview.primary }}
                  >
                    <Check className="w-2.5 h-2.5" style={{ color: theme.preview.bg }} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground/40 mt-3">Theme is saved automatically in your browser.</p>
    </Card>
  );
}

function TradingSection() {
  const { data: tickers } = useGetTicker({});
  const [defaultPair, setDefaultPair] = useState(() => {
    try { return localStorage.getItem(LAST_PAIR_KEY) || "crp_usdt"; } catch { return "crp_usdt"; }
  });
  const [defaultOrderType, setDefaultOrderType] = useState<"market" | "limit">(() => {
    try { return (localStorage.getItem(DEFAULT_TYPE_KEY) as "market" | "limit") || "market"; } catch { return "market"; }
  });

  const enabledPairs = tickers?.filter((t: any) => t.enable).map((t: any) => t.pair) ?? [];

  const savePair = (pair: string) => {
    setDefaultPair(pair);
    try { localStorage.setItem(LAST_PAIR_KEY, pair); } catch {}
    toast.success(`Default pair set to ${pair.replace("_", "/").toUpperCase()}`);
  };

  const saveOrderType = (type: "market" | "limit") => {
    setDefaultOrderType(type);
    try { localStorage.setItem(DEFAULT_TYPE_KEY, type); } catch {}
    toast.success(`Default order type set to ${type}`);
  };

  return (
    <Card className="border-white/[0.04] p-5">
      <SectionHeader
        icon={<ArrowRightLeft className="w-4 h-4" />}
        title="Trading Defaults"
        description="Pre-fill values used when opening the Trade page"
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
            Default Pair
          </label>
          <div className="relative">
            <select
              value={defaultPair}
              onChange={(e) => savePair(e.target.value)}
              className="w-full appearance-none bg-card border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm font-semibold uppercase focus:outline-none focus:ring-1 focus:ring-primary pr-8 text-foreground"
            >
              {enabledPairs.length === 0 ? (
                <option value={defaultPair}>{defaultPair.replace("_", "/").toUpperCase()}</option>
              ) : (
                enabledPairs.map((p: string) => (
                  <option key={p} value={p}>{p.replace("_", "/").toUpperCase()}</option>
                ))
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
          </div>
          <p className="text-[10px] text-muted-foreground/40">Opening the Trade tab will navigate here by default.</p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
            Default Order Type
          </label>
          <div className="flex bg-card border border-white/[0.06] p-1 rounded-lg">
            {(["market", "limit"] as const).map((type) => (
              <button
                key={type}
                onClick={() => saveOrderType(type)}
                className={cn(
                  "flex-1 py-2 text-xs rounded-md font-bold transition-all capitalize",
                  defaultOrderType === type
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {type}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/40">Pre-selects the order type when opening Trade.</p>
        </div>
      </div>
    </Card>
  );
}

function NotificationsSection() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    try { return Notification.permission; } catch { return "denied"; }
  });
  const [requesting, setRequesting] = useState(false);
  const { alerts, activeCount, clearTriggered } = usePriceAlerts();
  const triggeredCount = alerts.filter(a => a.triggered).length;

  const requestPermission = async () => {
    if (typeof Notification === "undefined") return;
    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        try { localStorage.setItem(NOTIF_ASKED_KEY, "yes"); } catch {}
        toast.success("Notifications enabled!");
      } else {
        toast.error("Notification permission denied. You may need to allow it in your browser settings.");
      }
    } finally {
      setRequesting(false);
    }
  };

  const sendTest = () => {
    try {
      new Notification("GHOSTD Test", {
        body: "Notifications are working correctly.",
        icon: "/icon-192.png",
      });
    } catch {
      toast.error("Could not send test notification.");
    }
  };

  const statusInfo = {
    granted: { icon: <BellRing className="w-4 h-4 text-success" />, label: "Enabled", color: "text-success", bg: "bg-success/8 border-success/20" },
    denied:  { icon: <BellOff  className="w-4 h-4 text-danger"  />, label: "Blocked", color: "text-danger",  bg: "bg-danger/8 border-danger/20"   },
    default: { icon: <Bell     className="w-4 h-4 text-muted-foreground" />, label: "Not set", color: "text-muted-foreground", bg: "bg-white/[0.04] border-white/[0.06]" },
  }[permission];

  return (
    <Card className="border-white/[0.04] p-5">
      <SectionHeader
        icon={<Bell className="w-4 h-4" />}
        title="Notifications"
        description="Browser push notifications for price alerts and order fills"
      />
      <div className="space-y-4">
        <div className={cn("flex items-center justify-between p-3.5 rounded-xl border", statusInfo.bg)}>
          <div className="flex items-center gap-2.5">
            {statusInfo.icon}
            <div>
              <p className={cn("text-sm font-semibold", statusInfo.color)}>
                Push notifications: {statusInfo.label}
              </p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                {permission === "granted"
                  ? "You'll be notified even when the tab is in the background."
                  : permission === "denied"
                  ? "Blocked in browser settings. Reset site permissions to re-enable."
                  : "Not yet requested — click Enable to allow notifications."}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {permission === "granted" && (
              <button
                onClick={sendTest}
                className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground hover:text-foreground transition-colors border border-white/[0.06]"
              >
                Test
              </button>
            )}
            {permission === "default" && (
              <button
                onClick={requestPermission}
                disabled={requesting}
                className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {requesting ? "Requesting…" : "Enable"}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-lg font-bold font-mono text-primary">{activeCount}</p>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-0.5">Active Alerts</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-lg font-bold font-mono text-muted-foreground">{triggeredCount}</p>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-0.5">Triggered</p>
            {triggeredCount > 0 && (
              <button
                onClick={() => { clearTriggered(); toast.success("Cleared triggered alerts"); }}
                className="mt-1.5 text-[9px] text-danger/60 hover:text-danger transition-colors font-semibold uppercase tracking-wide"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground/40">
          Manage individual alerts using the bell icon in the sidebar (desktop) or the menu (mobile).
        </p>
      </div>
    </Card>
  );
}

function DataSection() {
  const { watchlist } = useWatchlist();
  const { alerts } = usePriceAlerts();
  const [cleared, setCleared] = useState<string | null>(null);

  const clearItem = useCallback((key: string, label: string) => {
    try { localStorage.removeItem(key); } catch {}
    setCleared(label);
    toast.success(`${label} cleared`);
    setTimeout(() => setCleared(null), 2000);
  }, []);

  const clearPortfolioHistory = () => clearItem("ghostd_portfolio_history", "Portfolio history");
  const clearWatchlist = () => {
    try { localStorage.removeItem("ghostd_watchlist"); } catch {}
    toast.success("Watchlist cleared");
  };
  const clearAllAlerts = () => {
    try { localStorage.removeItem("ghostd_price_alerts"); } catch {}
    window.dispatchEvent(new CustomEvent("ghostd-alerts-changed"));
    toast.success("All price alerts cleared");
  };

  const items = [
    {
      label: "Portfolio history",
      description: "Session value snapshots used for the dashboard chart",
      storageKey: "ghostd_portfolio_history",
      count: (() => {
        try {
          const raw = localStorage.getItem("ghostd_portfolio_history");
          return raw ? JSON.parse(raw).length : 0;
        } catch { return 0; }
      })(),
      onClear: clearPortfolioHistory,
      icon: <RefreshCw className="w-3.5 h-3.5" />,
    },
    {
      label: "Watchlist",
      description: "Starred trading pairs saved in Markets",
      storageKey: "ghostd_watchlist",
      count: watchlist.size,
      onClear: clearWatchlist,
      icon: <Star className="w-3.5 h-3.5" />,
    },
    {
      label: "All price alerts",
      description: "Active and triggered price alert rules",
      storageKey: "ghostd_price_alerts",
      count: alerts.length,
      onClear: clearAllAlerts,
      icon: <Bell className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <Card className="border-white/[0.04] p-5">
      <SectionHeader
        icon={<Database className="w-4 h-4" />}
        title="Data & Storage"
        description="All data is stored locally in your browser — nothing is sent to external servers"
      />
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.storageKey}
            className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-muted-foreground/50">
                {item.icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">{item.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[10px] font-mono text-muted-foreground/40 tabular-nums">
                {item.count} {item.count === 1 ? "item" : "items"}
              </span>
              <button
                onClick={item.onClear}
                disabled={item.count === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-danger/60 hover:text-danger hover:bg-danger/8 transition-colors disabled:opacity-30 disabled:pointer-events-none border border-transparent hover:border-danger/15"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-primary/[0.03] border border-primary/10">
        <ShieldCheck className="w-3.5 h-3.5 text-primary/60 shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
          GHOSTD stores only UI preferences and portfolio snapshots in your browser.
          Your Utopia credentials are never stored — only a server-side session token is used.
        </p>
      </div>
    </Card>
  );
}

export function Settings() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-lg font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-[11px] mt-0.5">Appearance, trading defaults, notifications, and data</p>
      </div>

      <AppearanceSection />
      <TradingSection />
      <NotificationsSection />
      <DataSection />
    </motion.div>
  );
}
