// @ts-nocheck
import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "../../lib/utils.js"

// Cast primitives to avoid Vercel TS 5.9 "className does not exist" errors.
type RadioGroupRootProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  required?: boolean
  name?: string
  orientation?: "horizontal" | "vertical"
  dir?: "ltr" | "rtl"
  loop?: boolean
}
const RadioGroupRootPrim = RadioGroupPrimitive.Root as React.ForwardRefExoticComponent<
  RadioGroupRootProps & React.RefAttributes<HTMLDivElement>
>

type RadioGroupItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string
}
const RadioGroupItemPrim = RadioGroupPrimitive.Item as React.ForwardRefExoticComponent<
  RadioGroupItemProps & React.RefAttributes<HTMLButtonElement>
>

const RadioGroupIndicatorPrim = RadioGroupPrimitive.Indicator as React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLSpanElement> & { forceMount?: true } & React.RefAttributes<HTMLSpanElement>
>

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupRootProps>(
  ({ className, ...props }, ref) => (
    <RadioGroupRootPrim
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
)
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ className, ...props }, ref) => (
    <RadioGroupItemPrim
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupIndicatorPrim className="flex items-center justify-center">
        <Circle className="h-3.5 w-3.5 fill-primary" />
      </RadioGroupIndicatorPrim>
    </RadioGroupItemPrim>
  )
)
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
