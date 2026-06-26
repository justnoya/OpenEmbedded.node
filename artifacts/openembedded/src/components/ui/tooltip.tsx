import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "../../lib/utils.js"

// Cast primitive to avoid Vercel TS 5.9 "className does not exist" errors.
type TooltipContentProps = React.HTMLAttributes<HTMLDivElement> & {
  sideOffset?: number
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  alignOffset?: number
  forceMount?: true
  avoidCollisions?: boolean
  arrowPadding?: number
  collisionPadding?: number | Partial<Record<"top" | "right" | "bottom" | "left", number>>
}
const TooltipContentPrim = TooltipPrimitive.Content as React.ForwardRefExoticComponent<
  TooltipContentProps & React.RefAttributes<HTMLDivElement>
>

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

// Cast trigger so Vercel's TS 5.9 checker sees children + asChild
const TooltipTrigger = TooltipPrimitive.Trigger as React.ForwardRefExoticComponent<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean } & React.RefAttributes<HTMLButtonElement>
>

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Portal>
      <TooltipContentPrim
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]",
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
)
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
