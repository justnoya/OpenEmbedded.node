import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "../../lib/utils.js"

// Cast primitive to avoid Vercel TS 5.9 "className does not exist" errors.
type PopoverContentProps = React.HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "center" | "end"
  sideOffset?: number
  side?: "top" | "right" | "bottom" | "left"
  alignOffset?: number
  avoidCollisions?: boolean
  collisionBoundary?: Element | null | Array<Element | null>
  collisionPadding?: number | Partial<Record<"top" | "right" | "bottom" | "left", number>>
  arrowPadding?: number
  sticky?: "partial" | "always"
  hideWhenDetached?: boolean
  forceMount?: true
  onOpenAutoFocus?: (e: Event) => void
  onCloseAutoFocus?: (e: Event) => void
  onEscapeKeyDown?: (e: KeyboardEvent) => void
  onPointerDownOutside?: (e: Event) => void
  onFocusOutside?: (e: Event) => void
  onInteractOutside?: (e: Event) => void
}
const PopoverContentPrim = PopoverPrimitive.Content as React.ForwardRefExoticComponent<
  PopoverContentProps & React.RefAttributes<HTMLDivElement>
>

const Popover = PopoverPrimitive.Root

// Cast trigger/anchor so Vercel's TS 5.9 checker sees children + asChild
const PopoverTrigger = PopoverPrimitive.Trigger as React.ForwardRefExoticComponent<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean } & React.RefAttributes<HTMLButtonElement>
>

const PopoverAnchor = PopoverPrimitive.Anchor as React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean } & React.RefAttributes<HTMLElement>
>

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "center", sideOffset = 4, ...props }, ref) => (
    <PopoverPrimitive.Portal>
      <PopoverContentPrim
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
)
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
