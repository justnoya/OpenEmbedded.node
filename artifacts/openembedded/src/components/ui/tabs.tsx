import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "../../lib/utils.js"

// Cast primitives to avoid Vercel TS 5.9 "className does not exist" errors.
// See .agents/memory/radix-union-type-vercel.md
type P<E, T> = React.ForwardRefExoticComponent<T & React.RefAttributes<E>>

const TabsListPrim = TabsPrimitive.List as P<HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { loop?: boolean }>

const TabsTriggerPrim = TabsPrimitive.Trigger as P<HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }>

const TabsContentPrim = TabsPrimitive.Content as P<HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string; forceMount?: true }>

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { loop?: boolean }
>(({ className, ...props }, ref) => (
  <TabsListPrim
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, ...props }, ref) => (
  <TabsTriggerPrim
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string; forceMount?: true }
>(({ className, ...props }, ref) => (
  <TabsContentPrim
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
