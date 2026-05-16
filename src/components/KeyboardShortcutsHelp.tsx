import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

const SHORTCUTS = [
  { key: "d", label: "Go to Dashboard" },
  { key: "m", label: "Go to Markets" },
  { key: "t", label: "Go to Trade" },
  { key: "o", label: "Go to Orders" },
  { key: "w", label: "Go to Wallet" },
  { key: "h", label: "Go to History" },
  { key: "s", label: "Go to Settings" },
  { key: "q", label: "Open Quick Trade" },
  { key: "?", label: "Show keyboard shortcuts" },
  { key: "Escape", label: "Close dialogs / modals" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" /> Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="divide-y divide-border/40 rounded-xl border border-border/50 overflow-hidden">
          {SHORTCUTS.map(s => (
            <div key={s.key} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <kbd className="px-2 py-1 text-xs font-mono font-bold bg-muted border border-border rounded-md text-foreground min-w-[28px] text-center">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">Shortcuts are disabled while typing in input fields.</p>
      </DialogContent>
    </Dialog>
  );
}
