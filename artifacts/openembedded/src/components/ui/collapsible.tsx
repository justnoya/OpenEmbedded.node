// @ts-nocheck
"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

// Cast trigger/content so Vercel's TS 5.9 checker sees children + asChild
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger as React.ForwardRefExoticComponent<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean } & React.RefAttributes<HTMLButtonElement>
>

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent as React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & { forceMount?: true } & React.RefAttributes<HTMLDivElement>
>

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
