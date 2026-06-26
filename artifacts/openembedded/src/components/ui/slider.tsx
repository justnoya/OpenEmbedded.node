import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "../../lib/utils.js"

// Cast primitives to avoid Vercel TS 5.9 "className does not exist" errors.
type SliderRootProps = React.HTMLAttributes<HTMLSpanElement> & {
  defaultValue?: number[]
  value?: number[]
  onValueChange?: (value: number[]) => void
  onValueCommit?: (value: number[]) => void
  name?: string
  disabled?: boolean
  orientation?: "horizontal" | "vertical"
  dir?: "ltr" | "rtl"
  inverted?: boolean
  min?: number
  max?: number
  step?: number
  minStepsBetweenThumbs?: number
}
const SliderRootPrim = SliderPrimitive.Root as React.ForwardRefExoticComponent<
  SliderRootProps & React.RefAttributes<HTMLSpanElement>
>

const SliderTrackPrim = SliderPrimitive.Track as React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLSpanElement> & React.RefAttributes<HTMLSpanElement>
>

const SliderRangePrim = SliderPrimitive.Range as React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLSpanElement> & React.RefAttributes<HTMLSpanElement>
>

const SliderThumbPrim = SliderPrimitive.Thumb as React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLSpanElement> & React.RefAttributes<HTMLSpanElement>
>

const Slider = React.forwardRef<HTMLSpanElement, SliderRootProps>(
  ({ className, ...props }, ref) => (
    <SliderRootPrim
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderTrackPrim className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
        <SliderRangePrim className="absolute h-full bg-primary" />
      </SliderTrackPrim>
      <SliderThumbPrim className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
    </SliderRootPrim>
  )
)
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
