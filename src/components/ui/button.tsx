import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/85",
        destructive: "bg-danger/10 text-danger border border-danger/25 hover:bg-danger hover:text-danger-foreground",
        success: "bg-success/10 text-success border border-success/25 hover:bg-success hover:text-success-foreground",
        outline: "border border-white/[0.08] bg-transparent hover:bg-white/[0.04] text-muted-foreground hover:text-foreground",
        secondary: "bg-white/[0.05] text-foreground hover:bg-white/[0.08]",
        ghost: "hover:bg-white/[0.05] text-muted-foreground hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-8 px-3 py-1.5 text-xs",
        sm: "h-7 px-2.5 text-xs rounded",
        lg: "h-9 px-5 text-sm",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
