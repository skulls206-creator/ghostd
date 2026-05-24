import { Link, useLocation } from "wouter";
import { BarChart2, ArrowRightLeft, ListOrdered, Wallet, History, LogOut, Ghost, LifeBuoy, ChevronsRight, ChevronsLeft, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserInfo } from "@/api";
import { PriceAlertManager } from "@/components/PriceAlertManager";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { useState, useEffect } from "react";
import { ThemePickerSidebarItem } from "@/components/ThemePicker";
import { BUILD_VERSION } from "@/lib/version";

const SIDEBAR_KEY = "crp_sidebar_expanded";

interface SidebarProps {
  user: UserInfo;
  onLogout: () => void;
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/markets",   icon: BarChart2,        label: "Markets"   },
  { href: "/trade",     icon: ArrowRightLeft,   label: "Trade",    match: "/trade" },
  { href: "/orders",    icon: ListOrdered,      label: "Orders"    },
  { href: "/wallet",    icon: Wallet,           label: "Wallet"    },
  { href: "/history",   icon: History,          label: "History"   },
  { href: "/settings",  icon: Settings,         label: "Settings"  },
];

export function Sidebar({ user, onLogout }: SidebarProps) {
  const [location] = useLocation();
  const alertsApi = usePriceAlerts();
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(() => {
    try { const v = localStorage.getItem(SIDEBAR_KEY); return v === null ? true : v === "true"; } catch { return true; }
  });

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_KEY, String(expanded)); } catch {}
  }, [expanded]);

  const w = expanded ? "w-[180px]" : "w-[52px]";

  return (
    <aside className={cn(w, "border-r border-white/[0.04] bg-card flex-col justify-between hidden md:flex flex-shrink-0 transition-all duration-200 overflow-hidden")}>
      <div>
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center h-12 border-b border-white/[0.04] select-none hover:bg-white/[0.03] transition-colors",
            expanded ? "px-3 gap-2.5" : "justify-center"
          )}
          title="Dashboard"
        >
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
            <Ghost className="w-[14px] h-[14px] text-background" />
          </div>
          {expanded && (
            <span className="text-sm font-bold tracking-widest text-foreground whitespace-nowrap uppercase">
              Ghost<span className="text-primary">D</span>
            </span>
          )}
        </Link>

        <div className={cn("border-b border-white/[0.04] py-2", expanded ? "px-1.5" : "flex justify-center")}>
          <div
            className={cn(
              "relative flex items-center cursor-default",
              expanded ? "w-full px-2.5 h-9 gap-2.5" : ""
            )}
            onMouseEnter={() => !expanded && setTooltip("user")}
            onMouseLeave={() => setTooltip(null)}
            title={user.name}
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {expanded && (
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
              </div>
            )}
          </div>
          {!expanded && tooltip === "user" && (
            <div className="absolute left-[52px] ml-2 z-50 pointer-events-none" style={{ top: "auto" }}>
              <div className="bg-popover border border-white/[0.08] text-foreground text-xs font-medium px-2 py-1 rounded whitespace-nowrap shadow-lg">
                {user.name}
              </div>
            </div>
          )}
        </div>

        <nav className="flex flex-col py-2 gap-0.5">
          {navItems.map((item) => {
            const isActive = item.match
              ? location.startsWith(item.match)
              : location === item.href;

            return (
              <div key={item.href} className="relative w-full flex">
                <Link
                  href={item.href}
                  onMouseEnter={() => !expanded && setTooltip(item.label)}
                  onMouseLeave={() => setTooltip(null)}
                  className={cn(
                    "relative flex items-center rounded-md transition-all duration-150 group mx-auto",
                    expanded ? "w-full mx-1.5 px-2.5 h-9 gap-2.5" : "w-9 h-9 justify-center",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r-full" />
                  )}
                  <item.icon className="w-4 h-4 shrink-0" />
                  {expanded && (
                    <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
                  )}
                </Link>
                {!expanded && tooltip === item.label && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
                    <div className="bg-popover border border-white/[0.08] text-foreground text-xs font-medium px-2 py-1 rounded whitespace-nowrap shadow-lg">
                      {item.label}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col pb-2 gap-1 border-t border-white/[0.04] pt-2">
        <div className={cn("relative flex w-full", expanded ? "px-1.5" : "justify-center")}>
          <div
            className={expanded ? "w-full" : ""}
            onMouseEnter={() => !expanded && setTooltip("alerts")}
            onMouseLeave={() => setTooltip(null)}
          >
            <PriceAlertManager {...alertsApi} expanded={expanded} />
          </div>
          {!expanded && tooltip === "alerts" && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <div className="bg-popover border border-white/[0.08] text-foreground text-xs font-medium px-2 py-1 rounded whitespace-nowrap shadow-lg">
                Price Alerts
              </div>
            </div>
          )}
        </div>

        <div className={cn("relative flex w-full", expanded ? "px-1.5" : "justify-center")}>
          <a
            href="https://crp.is/profile/support"
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => !expanded && setTooltip("support")}
            onMouseLeave={() => setTooltip(null)}
            className={cn(
              "flex items-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors duration-150",
              expanded ? "w-full px-2.5 h-9 gap-2.5" : "w-9 h-9 justify-center"
            )}
            title="CRP.is Support"
          >
            <LifeBuoy className="w-4 h-4 shrink-0" />
            {expanded && (
              <span className="text-xs font-medium whitespace-nowrap">CRP.is Support ↗</span>
            )}
          </a>
          {!expanded && tooltip === "support" && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <div className="bg-popover border border-white/[0.08] text-foreground text-xs font-medium px-2 py-1 rounded whitespace-nowrap shadow-lg">
                CRP.is Support ↗
              </div>
            </div>
          )}
        </div>

        <div className={cn("relative flex w-full", expanded ? "px-1.5" : "justify-center")}>
          <button
            onClick={onLogout}
            onMouseEnter={() => !expanded && setTooltip("logout")}
            onMouseLeave={() => setTooltip(null)}
            className={cn(
              "flex items-center rounded-md text-muted-foreground hover:text-danger hover:bg-danger/8 transition-colors duration-150",
              expanded ? "w-full px-2.5 h-9 gap-2.5" : "w-9 h-9 justify-center"
            )}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {expanded && (
              <span className="text-xs font-medium whitespace-nowrap">Sign Out</span>
            )}
          </button>
          {!expanded && tooltip === "logout" && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <div className="bg-popover border border-white/[0.08] text-foreground text-xs font-medium px-2 py-1 rounded whitespace-nowrap shadow-lg">
                Sign Out
              </div>
            </div>
          )}
        </div>

        <div className={cn("relative flex w-full", expanded ? "px-1.5" : "justify-center")}>
          <div
            className="w-full"
            onMouseEnter={() => !expanded && setTooltip("theme")}
            onMouseLeave={() => setTooltip(null)}
          >
            <ThemePickerSidebarItem expanded={expanded} />
          </div>
          {!expanded && tooltip === "theme" && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <div className="bg-popover border border-white/[0.08] text-foreground text-xs font-medium px-2 py-1 rounded whitespace-nowrap shadow-lg">
                Theme
              </div>
            </div>
          )}
        </div>

        <div className={cn("relative flex w-full border-t border-white/[0.04] pt-1 mt-1", expanded ? "px-1.5" : "justify-center")}>
          <button
            onClick={() => setExpanded(v => !v)}
            onMouseEnter={() => !expanded && setTooltip("expand")}
            onMouseLeave={() => setTooltip(null)}
            className={cn(
              "flex items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors duration-150",
              expanded ? "w-full px-2.5 h-9 gap-2.5" : "w-9 h-9 justify-center"
            )}
            title={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {expanded ? <ChevronsLeft className="w-4 h-4 shrink-0" /> : <ChevronsRight className="w-4 h-4 shrink-0" />}
            {expanded && (
              <span className="text-xs font-medium whitespace-nowrap">Collapse</span>
            )}
          </button>
          {!expanded && tooltip === "expand" && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <div className="bg-popover border border-white/[0.08] text-foreground text-xs font-medium px-2 py-1 rounded whitespace-nowrap shadow-lg">
                Expand sidebar
              </div>
            </div>
          )}
        </div>

        {/* Build version */}
        {expanded && (
          <div className="px-2.5 pb-1">
            <p className="text-[10px] text-muted-foreground/40 font-mono select-none">{BUILD_VERSION}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
