// @ts-nocheck
import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "../../lib/utils.js"

// Cast primitive to avoid Vercel TS 5.9 "className does not exist" errors.
type SeparatorRootProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}
const SeparatorRootPrim = SeparatorPrimitive.Root as React.ForwardRefExoticComponent<
  SeparatorRootProps & React.RefAttributes<HTMLDivElement>
>

const Separator = React.forwardRef<HTMLDivElement, SeparatorRootProps>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <SeparatorRootPrim
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
