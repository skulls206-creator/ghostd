import { Palette } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTheme, type ThemeDefinition } from "@/hooks/useTheme";
import { useState } from "react";

function ThemeCard({ theme, active, onSelect }: { theme: ThemeDefinition; active: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative flex flex-col rounded-xl border-2 p-3 transition-all duration-200 text-left group overflow-hidden",
        active
          ? "border-[color:var(--theme-primary)] shadow-lg"
          : "border-white/[0.06] hover:border-white/[0.15]"
      )}
      style={{
        background: theme.preview.bg,
        "--theme-primary": theme.preview.primary,
      } as Record<string, string>}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-full" style={{ background: theme.preview.primary }} />
          <div className="w-3 h-3 rounded-full" style={{ background: theme.preview.accent }} />
          <div className="w-3 h-3 rounded-full bg-white/10" />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="h-1.5 rounded-full w-3/4" style={{ background: theme.preview.primary, opacity: 0.6 }} />
        <div className="h-1 rounded-full w-1/2 bg-white/10" />
        <div className="h-1 rounded-full w-2/3 bg-white/[0.06]" />
      </div>

      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-white/[0.06]">
        <div className="w-2 h-2 rounded-full" style={{ background: theme.preview.primary }} />
        <span className="text-[11px] font-semibold text-white/80">{theme.name}</span>
      </div>

      {active && (
        <div
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{ background: theme.preview.primary, color: theme.preview.bg }}
        >
          ✓
        </div>
      )}
    </button>
  );
}

export function ThemePickerButton() {
  const [open, setOpen] = useState(false);
  const { themeId, setTheme, themes } = useTheme();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors duration-150"
        title="Theme"
      >
        <Palette className="w-4 h-4 shrink-0" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Choose Theme
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                active={themeId === theme.id}
                onSelect={() => {
                  setTheme(theme.id);
                }}
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
            Theme preference is saved automatically
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ThemePickerMenuItem({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const { themeId, setTheme, themes } = useTheme();
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground text-xs font-medium hover:bg-white/[0.04] hover:text-foreground transition-colors w-full"
      >
        <Palette className="w-3.5 h-3.5 shrink-0" />
        Theme
      </button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) onClose?.(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Choose Theme
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                active={themeId === theme.id}
                onSelect={() => setTheme(theme.id)}
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
            Theme preference is saved automatically
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ThemePickerSidebarItem({ expanded }: { expanded: boolean }) {
  const [open, setOpen] = useState(false);
  const { themeId, setTheme, themes } = useTheme();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors duration-150",
          expanded ? "w-full px-2.5 h-9 gap-2.5" : "w-9 h-9 justify-center"
        )}
        title="Theme"
      >
        <Palette className="w-4 h-4 shrink-0" />
        {expanded && <span className="text-xs font-medium whitespace-nowrap">Theme</span>}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Choose Theme
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                active={themeId === theme.id}
                onSelect={() => setTheme(theme.id)}
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
            Theme preference is saved automatically
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
