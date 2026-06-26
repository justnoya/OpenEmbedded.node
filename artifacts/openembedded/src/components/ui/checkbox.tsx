import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "../../lib/utils.js"

// Cast primitive to avoid Vercel TS 5.9 "className does not exist" errors.
type CheckboxRootProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  checked?: boolean | "indeterminate"
  defaultChecked?: boolean | "indeterminate"
  onCheckedChange?: (checked: boolean | "indeterminate") => void
  required?: boolean
}
const CheckboxRootPrim = CheckboxPrimitive.Root as React.ForwardRefExoticComponent<
  CheckboxRootProps & React.RefAttributes<HTMLButtonElement>
>

const CheckboxIndicatorPrim = CheckboxPrimitive.Indicator as React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLSpanElement> & { forceMount?: true } & React.RefAttributes<HTMLSpanElement>
>

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxRootProps>(
  ({ className, ...props }, ref) => (
    <CheckboxRootPrim
      ref={ref}
      className={cn(
        "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className
      )}
      {...props}
    >
      <CheckboxIndicatorPrim
        className={cn("grid place-content-center text-current")}
      >
        <Check className="h-4 w-4" />
      </CheckboxIndicatorPrim>
    </CheckboxRootPrim>
  )
)
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
