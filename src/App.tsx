import { apiFetch } from "@/lib/apiFetch";
import { useState, useMemo } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/layout/AppLayout";
import { Login } from "@/pages/Login";
import { Ghost, ArrowLeft } from "lucide-react";
import { Dashboard } from "@/pages/Dashboard";
import { Markets } from "@/pages/Markets";
import { Trade } from "@/pages/Trade";
import { Orders } from "@/pages/Orders";
import { Wallet } from "@/pages/Wallet";
import { History } from "@/pages/History";
import { Settings } from "@/pages/Settings";
import { QuickTrade } from "@/components/QuickTrade";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useOrderFillMonitor } from "@/hooks/useOrderFillMonitor";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { useGetMe } from "@/api";
import { useInterval } from "@/hooks/useInterval";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  }
});

const LAST_PAIR_KEY = "crp_last_pair";

function Protected({ component: Component, params }: { component: React.ComponentType<any>, params?: any }) {
  const { data: session, isLoading } = useGetMe();
  const isLoggedIn = !!session?.user;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Redirect to="/login" />;
  }

  return (
    <AppLayout>
      <Component params={params} />
    </AppLayout>
  );
}

function TradeRedirect() {
  const [, navigate] = useLocation();
  const saved = (() => { try { return localStorage.getItem(LAST_PAIR_KEY); } catch { return null; } })();
  const dest = `/trade/${saved || "crp_usdt"}`;
  navigate(dest, { replace: true });
  return null;
}

// ─── Global app effects (keyboard shortcuts, fill monitor, alert polling) ───

function AppEffects() {
  const [, navigate] = useLocation();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { data: session } = useGetMe();
  const isLoggedIn = !!session?.user;
  const { checkPrices } = usePriceAlerts();

  // Order fill notifications
  useOrderFillMonitor(isLoggedIn);

  // Price alert polling: fetch tickers every 30s and check against active alerts
  useInterval(async () => {
    if (!isLoggedIn) return;
    try {
      const r = await apiFetch("/api/market/ticker");
      if (!r.ok) return;
      const data = await r.json();
      const tickers: Array<{ pair: string; lastPrice: number; enable: boolean }> = Array.isArray(data) ? data : (data.tickers ?? data.data ?? []);
      const map: Record<string, number> = {};
      tickers.forEach((t) => { if (t.enable) map[t.pair] = t.lastPrice; });
      if (Object.keys(map).length > 0) checkPrices(map);
    } catch {}
  }, 30_000);

  const getSavedPair = () => { try { return localStorage.getItem(LAST_PAIR_KEY) || "crp_usdt"; } catch { return "crp_usdt"; } };

  // Keyboard navigation shortcuts
  const shortcuts = useMemo(() => ({
    "d": () => navigate("/dashboard"),
    "m": () => navigate("/markets"),
    "t": () => navigate(`/trade/${getSavedPair()}`),
    "o": () => navigate("/orders"),
    "w": () => navigate("/wallet"),
    "h": () => navigate("/history"),
    "s": () => navigate("/settings"),
    "?": () => setShortcutsOpen(true),
  }), [navigate]);

  useKeyboardShortcuts(shortcuts, isLoggedIn);

  return (
    <>
      {isLoggedIn && <QuickTrade />}
      <KeyboardShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  );
}

function Router() {
  return (
    <>
      <AppEffects />
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/dashboard">{() => <Protected component={Dashboard} />}</Route>
        <Route path="/markets">{() => <Protected component={Markets} />}</Route>
        <Route path="/trade" component={TradeRedirect} />
        <Route path="/trade/:pair">{(params) => <Protected component={Trade} params={params} />}</Route>
        <Route path="/orders">{() => <Protected component={Orders} />}</Route>
        <Route path="/wallet">{() => <Protected component={Wallet} />}</Route>
        <Route path="/history">{() => <Protected component={History} />}</Route>
        <Route path="/settings">{() => <Protected component={Settings} />}</Route>
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        <Route path="/:rest*">
          <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
            <div className="max-w-sm w-full text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                <Ghost className="w-8 h-8 text-primary opacity-60" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-foreground font-mono mb-2">404</h1>
                <p className="text-sm text-muted-foreground">This page doesn't exist or has been moved.</p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-background text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </Route>
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster position="bottom-right" richColors closeButton />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
