// @ts-nocheck
import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils.js"

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Vercel's TypeScript checker (node16 resolution) strips HTML attributes from Radix's
// ToggleProps, losing className/children. Cast using standard React HTML types which
// always include these props under any TypeScript configuration.
type ToggleRootProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.RefAttributes<HTMLButtonElement> & {
    pressed?: boolean
    defaultPressed?: boolean
    onPressedChange?: (pressed: boolean) => void
    asChild?: boolean
  }
const ToggleRoot = TogglePrimitive.Root as React.ForwardRefExoticComponent<ToggleRootProps>

const Toggle = React.forwardRef<
  HTMLButtonElement,
  ToggleRootProps & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <ToggleRoot
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
