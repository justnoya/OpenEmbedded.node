// @ts-nocheck
import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "../../lib/utils.js"

// Cast ALL vaul primitives — Vercel TS 5.9 strips className/children from their prop types.
type P<E, T> = React.ForwardRefExoticComponent<T & React.RefAttributes<E>>

type DrawerRootProps = React.HTMLAttributes<HTMLDivElement> & {
  shouldScaleBackground?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  direction?: "top" | "bottom" | "left" | "right"
  dismissible?: boolean
  fadeFromIndex?: number
  snapPoints?: (number | string)[]
  activeSnapPoint?: number | string | null
  setActiveSnapPoint?: (snapPoint: number | string | null) => void
  nested?: boolean
  onDrag?: (event: React.PointerEvent<HTMLDivElement>, percentageDragged: number) => void
  onRelease?: (event: React.PointerEvent<HTMLDivElement>, open: boolean) => void
  onClose?: () => void
  handleOnly?: boolean
  fixed?: boolean
  preventScrollRestoration?: boolean
}

const DrawerRootPrim    = DrawerPrimitive.Root        as React.FC<DrawerRootProps>
const DrawerOverlayPrim = DrawerPrimitive.Overlay     as P<HTMLDivElement,   React.HTMLAttributes<HTMLDivElement>>
const DrawerContentPrim = DrawerPrimitive.Content     as P<HTMLDivElement,   React.HTMLAttributes<HTMLDivElement>>
const DrawerTitlePrim   = DrawerPrimitive.Title       as P<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>
const DrawerDescPrim    = DrawerPrimitive.Description as P<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>

const Drawer = ({ shouldScaleBackground = true, ...props }: DrawerRootProps) => (
  <DrawerRootPrim shouldScaleBackground={shouldScaleBackground} {...props} />
)
Drawer.displayName = "Drawer"

// Cast trigger/close so Vercel's TS 5.9 checker sees children + asChild
const DrawerTrigger = DrawerPrimitive.Trigger as React.ForwardRefExoticComponent<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean } & React.RefAttributes<HTMLButtonElement>
>

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close as React.ForwardRefExoticComponent<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean } & React.RefAttributes<HTMLButtonElement>
>

const DrawerOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <DrawerOverlayPrim
      ref={ref}
      className={cn("fixed inset-0 z-50 bg-black/80", className)}
      {...props}
    />
  )
)
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerContentPrim
        ref={ref}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
          className
        )}
        {...props}
      >
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        {children}
      </DrawerContentPrim>
    </DrawerPortal>
  )
)
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)} {...props} />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <DrawerTitlePrim
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
)
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <DrawerDescPrim
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
