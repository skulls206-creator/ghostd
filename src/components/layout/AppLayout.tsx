import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, useLogout, getGetMeQueryKey } from "@/api";
import { Sidebar } from "./Sidebar";
import { Ghost, BarChart2, ArrowRightLeft, ListOrdered, Wallet, History, LogOut, LifeBuoy, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKhurkOS } from "@/hooks/useKhurkOS";
import { ThemePickerMenuItem } from "@/components/ThemePicker";

const LAST_PAIR_KEY = "crp_last_pair";

const bottomNavItems = [
  { href: "/markets",  icon: BarChart2,       label: "Markets", match: undefined },
  { href: "/orders",   icon: ListOrdered,     label: "Orders",  match: undefined },
  { href: "/trade",    icon: ArrowRightLeft,  label: "Trade",   match: "/trade",  center: true },
  { href: "/wallet",   icon: Wallet,          label: "Wallet",  match: undefined },
  { href: "/history",  icon: History,         label: "History", match: undefined },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading, isError } = useGetMe({ 
    query: { queryKey: ["q"], retry: false } 
  });
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const { showBanner, themeActive, acceptTheme, dismissBanner } = useKhurkOS();

  useEffect(() => {
    if (isError) setLocation("/login");
  }, [isError, setLocation]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-primary relative overflow-hidden">
        <Ghost className="w-8 h-8 mb-4 opacity-40" />
        <div className="animate-spin rounded-full border border-primary/30 border-t-primary h-5 w-5" />
      </div>
    );
  }

  if (!session) return null;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.removeQueries();
        try { localStorage.removeItem("ghostd_portfolio_history"); } catch {}
        setLocation("/login");
      }
    });
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden relative">
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <Sidebar user={session.user} onLogout={handleLogout} />

      {/* ── Mobile top header ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-11 border-b border-white/[0.04] bg-background/95 backdrop-blur-md flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 select-none">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <Ghost className="w-[12px] h-[12px] text-background" />
          </div>
          <span className="font-sans font-bold text-sm leading-none tracking-widest uppercase text-foreground">
            Ghost<span className="text-primary">D</span>
          </span>
        </Link>

        <button
          onClick={() => setMenuOpen(v => !v)}
          className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors text-xs font-medium"
        >
          {menuOpen ? "✕" : session.user.name.charAt(0).toUpperCase()}
        </button>
      </header>

      {/* ── Mobile dropdown ── */}
      {menuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/60"
            onClick={() => setMenuOpen(false)}
          />
          <div className="md:hidden fixed top-11 right-0 z-40 w-52 border-l border-b border-white/[0.06] bg-card shadow-2xl p-3 flex flex-col gap-1">
            <div className="px-3 py-2 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                {session.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-foreground truncate">{session.user.name}</p>
                <p className="text-[10px] text-muted-foreground/60 truncate">{session.user.id.substring(0, 8)}…</p>
              </div>
            </div>
            <div className="border-t border-white/[0.04] pt-1">
              <ThemePickerMenuItem onClose={() => setMenuOpen(false)} />
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground text-xs font-medium hover:bg-white/[0.04] hover:text-foreground transition-colors w-full"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </Link>
              <a
                href="https://crp.is/profile/support"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground text-xs font-medium hover:bg-primary/8 hover:text-primary transition-colors w-full"
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                CRP.is Support ↗
              </a>
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground text-xs font-medium hover:bg-danger/8 hover:text-danger transition-colors w-full"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── KHURK OS embed banner ── */}
      {showBanner && (
        <div className="fixed top-11 md:top-0 inset-x-0 z-50 flex items-center justify-between gap-3 px-4 py-2 bg-[#1a1033] border-b border-[#5865F2]/30 shadow-lg shadow-black/40 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base leading-none select-none">👻</span>
            <span className="text-white/90 font-medium truncate text-xs">
              Looks like you're in <span className="text-[#5865F2] font-bold">KHURK OS</span> — want to switch to the embedded theme?
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={acceptTheme}
              className="px-2.5 py-1 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition-colors"
            >
              Apply
            </button>
            <button
              onClick={dismissBanner}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white/70 text-xs font-semibold transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto relative z-10 min-w-0">
        <div className={cn(
          "max-w-[1600px] mx-auto px-4 md:px-6 py-4 md:py-5 min-h-full pb-20 md:pb-5",
          showBanner ? "pt-[88px] md:pt-[44px]" : "pt-[56px] md:pt-5"
        )}>
          {children}
        </div>
      </main>

      {/* ── Mobile bottom nav — icon-only ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 border-t border-white/[0.04] bg-background/95 backdrop-blur-md flex items-center justify-around">
        {bottomNavItems.map((item) => {
          const isActive = item.match
            ? location.startsWith(item.match)
            : location === item.href;

          if (item.center) {
            const tradePair = (() => { try { return localStorage.getItem(LAST_PAIR_KEY); } catch { return null; } })();
            const tradeHref = tradePair ? `/trade/${tradePair}` : "/trade";
            return (
              <Link key={item.href} href={tradeHref} className="flex items-center justify-center -mt-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                  isActive
                    ? "bg-primary"
                    : "bg-primary/15 border border-primary/25"
                )}>
                  <item.icon className={cn("w-4 h-4", isActive ? "text-background" : "text-primary")} />
                </div>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href} className="flex items-center justify-center w-10 h-10">
              <item.icon className={cn(
                "w-4.5 h-4.5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground/50"
              )} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
