"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "../../lib/utils.js"

// Cast primitives to avoid Vercel TS 5.9 "className does not exist" errors.
type P<E, T> = React.ForwardRefExoticComponent<T & React.RefAttributes<E>>
type MenuItemProps = React.HTMLAttributes<HTMLDivElement> & { disabled?: boolean; onSelect?: (e: Event) => void; textValue?: string }
type ContentProps = React.HTMLAttributes<HTMLDivElement> & {
  sideOffset?: number; side?: "top"|"right"|"bottom"|"left"
  align?: "start"|"center"|"end"; alignOffset?: number; avoidCollisions?: boolean
  forceMount?: true; loop?: boolean
}

const SubTriggerPrim = DropdownMenuPrimitive.SubTrigger as P<HTMLDivElement, MenuItemProps>
const SubContentPrim = DropdownMenuPrimitive.SubContent as P<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { sideOffset?: number; forceMount?: true }>
const ContentPrim = DropdownMenuPrimitive.Content as P<HTMLDivElement, ContentProps>
const ItemPrim = DropdownMenuPrimitive.Item as P<HTMLDivElement, MenuItemProps>
const CheckboxItemPrim = DropdownMenuPrimitive.CheckboxItem as P<HTMLDivElement, MenuItemProps & { checked?: boolean | "indeterminate"; onCheckedChange?: (c: boolean | "indeterminate") => void }>
const RadioItemPrim = DropdownMenuPrimitive.RadioItem as P<HTMLDivElement, MenuItemProps & { value: string }>
const LabelPrim = DropdownMenuPrimitive.Label as P<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>
const SeparatorPrim = DropdownMenuPrimitive.Separator as P<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>
const ItemIndicatorPrim = DropdownMenuPrimitive.ItemIndicator as P<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & { forceMount?: true }>

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuSub = DropdownMenuPrimitive.Sub
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  HTMLDivElement,
  MenuItemProps & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <SubTriggerPrim
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </SubTriggerPrim>
))
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sideOffset?: number; forceMount?: true }
>(({ className, ...props }, ref) => (
  <SubContentPrim
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<HTMLDivElement, ContentProps>(
  ({ className, sideOffset = 4, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
      <ContentPrim
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
)
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  MenuItemProps & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <ItemPrim
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  MenuItemProps & { checked?: boolean | "indeterminate"; onCheckedChange?: (c: boolean | "indeterminate") => void }
>(({ className, children, checked, ...props }, ref) => (
  <CheckboxItemPrim
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
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
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  HTMLDivElement,
  MenuItemProps & { value: string }
>(({ className, children, ...props }, ref) => (
  <RadioItemPrim
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ItemIndicatorPrim>
        <Circle className="h-2 w-2 fill-current" />
      </ItemIndicatorPrim>
    </span>
    {children}
  </RadioItemPrim>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <LabelPrim
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <SeparatorPrim
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
