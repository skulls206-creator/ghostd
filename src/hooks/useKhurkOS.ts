import { useEffect, useState } from "react";

const DISMISSED_KEY = "ghostd_khurk_banner_dismissed";
const THEME_KEY = "ghostd_khurk_theme_active";

export type KhurkTheme = {
  theme?: "dark" | "light";
  accent?: string;
};

function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true; // cross-origin access threw, so we ARE in an iframe
  }
}

export function useKhurkOS() {
  const [inKhurkOS, setInKhurkOS] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [themeActive, setThemeActive] = useState(false);
  const [khurkTheme, setKhurkTheme] = useState<KhurkTheme>({});

  useEffect(() => {
    const embedded = isInIframe();
    setInKhurkOS(embedded);

    try {
      const dismissed = localStorage.getItem(DISMISSED_KEY) === "true";
      const themeOn = localStorage.getItem(THEME_KEY) === "true";
      setBannerDismissed(dismissed);
      if (themeOn && embedded) {
        setThemeActive(true);
        applyKhurkTheme(true);
      }
    } catch { /* storage unavailable */ }

    if (!embedded) return;

    const handler = (event: MessageEvent) => {
      // Accept messages from any khurk.services origin or same origin
      const origin: string = event.origin;
      const trusted =
        origin.endsWith(".khurk.services") ||
        origin === "https://khurk.services" ||
        origin === window.location.origin;

      if (!trusted) return;
      if (event.data?.type !== "KHURK_THEME") return;

      const payload: KhurkTheme = {
        theme: event.data.theme,
        accent: event.data.accent,
      };
      setKhurkTheme(payload);
      applyKhurkTheme(true, payload);
      setThemeActive(true);
      setBannerDismissed(true);
      try { localStorage.setItem(THEME_KEY, "true"); } catch { /* ignore */ }
      try { localStorage.setItem(DISMISSED_KEY, "true"); } catch { /* ignore */ }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const acceptTheme = () => {
    applyKhurkTheme(true, khurkTheme);
    setThemeActive(true);
    setBannerDismissed(true);
    try { localStorage.setItem(THEME_KEY, "true"); } catch { /* ignore */ }
    try { localStorage.setItem(DISMISSED_KEY, "true"); } catch { /* ignore */ }
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
    try { localStorage.setItem(DISMISSED_KEY, "true"); } catch { /* ignore */ }
  };

  const resetTheme = () => {
    applyKhurkTheme(false);
    setThemeActive(false);
    try { localStorage.removeItem(THEME_KEY); } catch { /* ignore */ }
  };

  const showBanner = inKhurkOS && !bannerDismissed;

  return { inKhurkOS, showBanner, themeActive, khurkTheme, acceptTheme, dismissBanner, resetTheme };
}

function applyKhurkTheme(active: boolean, theme?: KhurkTheme) {
  const root = document.documentElement;
  if (active) {
    root.setAttribute("data-khurk", "true");
    if (theme?.accent) {
      // Convert hex accent to HSL for CSS vars if provided
      root.style.setProperty("--khurk-accent", theme.accent);
    }
  } else {
    root.removeAttribute("data-khurk");
    root.style.removeProperty("--khurk-accent");
  }
}
