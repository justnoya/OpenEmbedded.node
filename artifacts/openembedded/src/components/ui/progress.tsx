"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "../../lib/utils.js"

// Cast primitive to avoid Vercel TS 5.9 "className does not exist" errors.
type ProgressRootProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number | null
  max?: number
  getValueLabel?: (value: number, max: number) => string
}
const ProgressRootPrim = ProgressPrimitive.Root as React.ForwardRefExoticComponent<
  ProgressRootProps & React.RefAttributes<HTMLDivElement>
>

const ProgressIndicatorPrim = ProgressPrimitive.Indicator as React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>

const Progress = React.forwardRef<HTMLDivElement, ProgressRootProps>(
  ({ className, value, ...props }, ref) => (
    <ProgressRootPrim
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
        className
      )}
      {...props}
    >
      <ProgressIndicatorPrim
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressRootPrim>
  )
)
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
