import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Minus } from "lucide-react"

import { cn } from "../../lib/utils.js"

// Cast OTPInput to avoid Vercel TS 5.9 "className does not exist" errors.
type OTPInputProps = React.HTMLAttributes<HTMLDivElement> & {
  maxLength: number
  containerClassName?: string
  value?: string
  onChange?: (value: string) => void
  onComplete?: (...args: unknown[]) => void
  pattern?: string
  inputMode?: "numeric" | "text" | "decimal" | "tel" | "search" | "email" | "url"
  allowNavigation?: boolean
  pushPasswordManagerStrategy?: "increase-width" | "none"
  pasteTransformer?: (pasted: string) => string
  autoFocus?: boolean
  disabled?: boolean
  id?: string
  name?: string
}
const OTPInputPrim = OTPInput as React.ForwardRefExoticComponent<
  OTPInputProps & React.RefAttributes<HTMLInputElement>
>

const InputOTP = React.forwardRef<
  HTMLInputElement,
  OTPInputProps
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInputPrim
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-1 ring-ring",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Minus />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
