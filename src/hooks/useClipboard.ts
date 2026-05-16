import { useCallback } from "react";
import { toast } from "sonner";

export function useClipboard() {
  const copy = useCallback((text: string, label = "Copied") => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(label, { duration: 1500, position: "bottom-center" });
    }).catch(() => {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      toast.success(label, { duration: 1500, position: "bottom-center" });
    });
  }, []);

  return { copy };
}
