// @ts-nocheck
import * as React from "react"
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "../../lib/utils.js"

// Cast primitives to avoid Vercel TS 5.9 "className does not exist" errors.
type P<E, T> = React.ForwardRefExoticComponent<T & React.RefAttributes<E>>
type MenuItemProps = React.HTMLAttributes<HTMLDivElement> & { disabled?: boolean; onSelect?: (e: Event) => void; textValue?: string }

const SubTriggerPrim = ContextMenuPrimitive.SubTrigger as P<HTMLDivElement, MenuItemProps>
const SubContentPrim = ContextMenuPrimitive.SubContent as P<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { sideOffset?: number; forceMount?: true }>
const ContentPrim = ContextMenuPrimitive.Content as P<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { loop?: boolean; forceMount?: true; alignOffset?: number; avoidCollisions?: boolean; collisionPadding?: number }>
const ItemPrim = ContextMenuPrimitive.Item as P<HTMLDivElement, MenuItemProps>
const CheckboxItemPrim = ContextMenuPrimitive.CheckboxItem as P<HTMLDivElement, MenuItemProps & { checked?: boolean | "indeterminate"; onCheckedChange?: (c: boolean | "indeterminate") => void }>
const RadioItemPrim = ContextMenuPrimitive.RadioItem as P<HTMLDivElement, MenuItemProps & { value: string }>
const LabelPrim = ContextMenuPrimitive.Label as P<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>
const SeparatorPrim = ContextMenuPrimitive.Separator as P<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>
const ItemIndicatorPrim = ContextMenuPrimitive.ItemIndicator as P<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & { forceMount?: true }>

const ContextMenu = ContextMenuPrimitive.Root
// Cast trigger so Vercel's TS 5.9 checker sees children + asChild
const ContextMenuTrigger = ContextMenuPrimitive.Trigger as React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean } & React.RefAttributes<HTMLElement>
>
const ContextMenuGroup = ContextMenuPrimitive.Group
const ContextMenuPortal = ContextMenuPrimitive.Portal
const ContextMenuSub = ContextMenuPrimitive.Sub
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup

const ContextMenuSubTrigger = React.forwardRef<
  HTMLDivElement,
  MenuItemProps & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <SubTriggerPrim
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </SubTriggerPrim>
))
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName

const ContextMenuSubContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sideOffset?: number; forceMount?: true }
>(({ className, ...props }, ref) => (
  <SubContentPrim
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-context-menu-content-transform-origin]",
      className
    )}
    {...props}
  />
))
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName

const ContextMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { loop?: boolean; forceMount?: true }
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContentPrim
      ref={ref}
      className={cn(
        "z-50 max-h-[--radix-context-menu-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-context-menu-content-transform-origin]",
        className
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
))
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName

const ContextMenuItem = React.forwardRef<
  HTMLDivElement,
  MenuItemProps & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <ItemPrim
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName

const ContextMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  MenuItemProps & { checked?: boolean | "indeterminate"; onCheckedChange?: (c: boolean | "indeterminate") => void }
>(({ className, children, checked, ...props }, ref) => (
  <CheckboxItemPrim
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ItemIndicatorPrim>
        <Check className="h-4 w-4" />
      </ItemIndicatorPrim>
    </span>
    {children}
  </CheckboxItemPrim>
))
ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName

const ContextMenuRadioItem = React.forwardRef<
  HTMLDivElement,
  MenuItemProps & { value: string }
>(({ className, children, ...props }, ref) => (
  <RadioItemPrim
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ItemIndicatorPrim>
        <Circle className="h-4 w-4 fill-current" />
      </ItemIndicatorPrim>
    </span>
    {children}
  </RadioItemPrim>
))
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName

const ContextMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <LabelPrim
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName

const ContextMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <SeparatorPrim
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
))
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName

const ContextMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
ContextMenuShortcut.displayName = "ContextMenuShortcut"

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}
