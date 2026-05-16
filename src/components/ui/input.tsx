import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  ghost?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, suffix, ghost, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 text-muted-foreground flex items-center justify-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex w-full text-sm transition-all duration-150",
            "placeholder:text-muted-foreground/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            ghost
              ? [
                  "bg-transparent border-0 border-b border-white/[0.1] rounded-none px-0 py-2",
                  "focus-visible:outline-none focus-visible:border-primary",
                ]
              : [
                  "rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2",
                  "focus-visible:outline-none focus-visible:border-primary/60 focus-visible:bg-white/[0.05]",
                ],
            icon && "pl-9",
            suffix && "pr-14",
            className
          )}
          ref={ref}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 text-muted-foreground text-xs font-semibold pointer-events-none font-mono">
            {suffix}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
