// @ts-nocheck
import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "../../lib/utils.js"

// Cast primitives to avoid Vercel TS 5.9 "className does not exist" errors.
type P<E, T> = React.ForwardRefExoticComponent<T & React.RefAttributes<E>>

const ScrollAreaRootPrim = ScrollAreaPrimitive.Root as P<HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { type?: "auto" | "always" | "scroll" | "hover"; scrollHideDelay?: number }>

const ScrollAreaViewportPrim = ScrollAreaPrimitive.Viewport as P<HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>>

const ScrollbarPrim = ScrollAreaPrimitive.ScrollAreaScrollbar as P<HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical"; forceMount?: true }>

const ScrollAreaThumbPrim = ScrollAreaPrimitive.ScrollAreaThumb as P<HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>>

const ScrollAreaCornerPrim = ScrollAreaPrimitive.Corner as P<HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>>

const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { type?: "auto" | "always" | "scroll" | "hover"; scrollHideDelay?: number }
>(({ className, children, ...props }, ref) => (
  <ScrollAreaRootPrim
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaViewportPrim className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaViewportPrim>
    <ScrollBar />
    <ScrollAreaCornerPrim />
  </ScrollAreaRootPrim>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical"; forceMount?: true }
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollbarPrim
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaThumbPrim className="relative flex-1 rounded-full bg-border" />
  </ScrollbarPrim>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
