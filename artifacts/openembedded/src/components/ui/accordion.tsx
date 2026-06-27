// @ts-nocheck
import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "../../lib/utils.js"

// Cast primitives to avoid Vercel TS 5.9 "className does not exist" errors.
type P<E, T> = React.ForwardRefExoticComponent<T & React.RefAttributes<E>>

const AccordionItemPrim = AccordionPrimitive.Item as P<HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string; disabled?: boolean }>

const AccordionTriggerPrim = AccordionPrimitive.Trigger as P<HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>>

const AccordionContentPrim = AccordionPrimitive.Content as P<HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>>

const AccordionHeaderPrim = AccordionPrimitive.Header as P<HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>>

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string; disabled?: boolean }
>(({ className, ...props }, ref) => (
  <AccordionItemPrim
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <AccordionHeaderPrim className="flex">
    <AccordionTriggerPrim
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
    </AccordionTriggerPrim>
  </AccordionHeaderPrim>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <AccordionContentPrim
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionContentPrim>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
