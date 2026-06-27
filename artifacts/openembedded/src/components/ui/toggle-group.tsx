// @ts-nocheck
"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils.js"
import { toggleVariants } from "./toggle.js"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

// Vercel's TypeScript checker (node16 resolution) resolves ToggleGroupPrimitive.Root
// as ToggleGroupSingleProps | ToggleGroupMultipleProps — a union type that loses
// children/className. Cast using standard React HTML types which always carry those
// props under any TypeScript configuration.
type ToggleGroupRootProps = React.HTMLAttributes<HTMLDivElement> &
  React.RefAttributes<HTMLDivElement> & {
    type?: "single" | "multiple"
    value?: string | string[]
    defaultValue?: string | string[]
    onValueChange?: ((value: string) => void) | ((value: string[]) => void)
    disabled?: boolean
    rovingFocus?: boolean
    orientation?: "horizontal" | "vertical"
    dir?: "ltr" | "rtl"
    loop?: boolean
    asChild?: boolean
  }
const ToggleGroupRoot = ToggleGroupPrimitive.Root as React.ForwardRefExoticComponent<ToggleGroupRootProps>

type ToggleGroupItemRootProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.RefAttributes<HTMLButtonElement> & {
    value: string
    disabled?: boolean
    asChild?: boolean
  }
const ToggleGroupItemRoot = ToggleGroupPrimitive.Item as React.ForwardRefExoticComponent<ToggleGroupItemRootProps>

const ToggleGroup = React.forwardRef<
  HTMLDivElement,
  ToggleGroupRootProps & VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupRoot
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupRoot>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  ToggleGroupItemRootProps & VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupItemRoot
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupItemRoot>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
