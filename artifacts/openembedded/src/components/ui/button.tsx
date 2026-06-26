import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils.js"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none cursor-pointer",
  {
    variants: {
      variant: {
        /* Primary CTA — near-white on deepest dark. Vercel/Linear tier. */
        default:
          "rounded-[9px] bg-[#efefef] text-[#111111] border border-[rgba(255,255,255,0.12)] shadow-[0_1px_2px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white active:bg-[#e0e0e0] active:shadow-none transition-all duration-100",

        /* Destructive — muted red, no glow */
        destructive:
          "rounded-[9px] bg-[rgba(248,81,73,0.10)] text-[#f85149] border border-[rgba(248,81,73,0.22)] hover:bg-[rgba(248,81,73,0.16)] active:bg-[rgba(248,81,73,0.08)] shadow-[0_1px_2px_rgba(0,0,0,0.5)]",

        /* Outline — dark surface with hairline border */
        outline:
          "rounded-[9px] bg-[#1e1e1e] text-[#d0d0d0] border border-[rgba(255,255,255,0.09)] shadow-[0_1px_2px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-[#242424] hover:border-[rgba(255,255,255,0.14)] active:bg-[#1a1a1a]",

        /* Secondary — dimmer dark, one step below outline */
        secondary:
          "rounded-[9px] bg-[#181818] text-[#909090] border border-[rgba(255,255,255,0.07)] hover:bg-[#1e1e1e] hover:text-[#c0c0c0] hover:border-[rgba(255,255,255,0.10)] active:bg-[#161616]",

        /* Ghost — transparent, appears on hover */
        ghost:
          "rounded-[9px] bg-transparent text-[#909090] border border-transparent hover:bg-[rgba(255,255,255,0.05)] hover:text-[#e0e0e0] active:bg-[rgba(255,255,255,0.03)]",

        link: "text-[#c0c0c0] underline-offset-4 hover:underline hover:text-[#f0f0f0]",
      },
      size: {
        default: "min-h-9 px-4 py-2",
        sm:      "min-h-8 rounded-[7px] px-3 text-xs",
        lg:      "min-h-10 rounded-[10px] px-8 text-[15px]",
        icon:    "h-9 w-9",
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
