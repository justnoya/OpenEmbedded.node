"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils.js"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

// Cast primitive to avoid Vercel TS 5.9 "className does not exist" errors.
type LabelRootProps = React.LabelHTMLAttributes<HTMLLabelElement>
const LabelRootPrim = LabelPrimitive.Root as React.ForwardRefExoticComponent<
  LabelRootProps & React.RefAttributes<HTMLLabelElement>
>

const Label = React.forwardRef<
  HTMLLabelElement,
  LabelRootProps & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelRootPrim
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
