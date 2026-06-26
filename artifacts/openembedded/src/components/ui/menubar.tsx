import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "../../lib/utils.js"

// Cast primitives to avoid Vercel TS 5.9 "className does not exist" errors.
type P<E, T> = React.ForwardRefExoticComponent<T & React.RefAttributes<E>>
type MenuItemProps = React.HTMLAttributes<HTMLDivElement> & { disabled?: boolean; onSelect?: (e: Event) => void; textValue?: string }
type ContentProps = React.HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "center" | "end"; alignOffset?: number; sideOffset?: number
  side?: "top" | "right" | "bottom" | "left"; loop?: boolean; forceMount?: true
}

const MenubarRootPrim = MenubarPrimitive.Root as P<HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { loop?: boolean; dir?: "ltr" | "rtl" }>
const MenubarTriggerPrim = MenubarPrimitive.Trigger as P<HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>>
const SubTriggerPrim = MenubarPrimitive.SubTrigger as P<HTMLDivElement, MenuItemProps>
const SubContentPrim = MenubarPrimitive.SubContent as P<HTMLDivElement, ContentProps>
const ContentPrim = MenubarPrimitive.Content as P<HTMLDivElement, ContentProps>
const ItemPrim = MenubarPrimitive.Item as P<HTMLDivElement, MenuItemProps>
const CheckboxItemPrim = MenubarPrimitive.CheckboxItem as P<HTMLDivElement, MenuItemProps & { checked?: boolean | "indeterminate"; onCheckedChange?: (c: boolean | "indeterminate") => void }>
const RadioItemPrim = MenubarPrimitive.RadioItem as P<HTMLDivElement, MenuItemProps & { value: string }>
const LabelPrim = MenubarPrimitive.Label as P<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>
const SeparatorPrim = MenubarPrimitive.Separator as P<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>
const ItemIndicatorPrim = MenubarPrimitive.ItemIndicator as P<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & { forceMount?: true }>

function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu {...props} />
}

function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group {...props} />
}

function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal {...props} />
}

function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return <MenubarPrimitive.RadioGroup {...props} />
}

function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

const Menubar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { loop?: boolean; dir?: "ltr" | "rtl" }
>(({ className, ...props }, ref) => (
  <MenubarRootPrim
    ref={ref}
    className={cn(
      "flex h-9 items-center space-x-1 rounded-md border bg-background p-1 shadow-sm",
      className
    )}
    {...props}
  />
))
Menubar.displayName = MenubarPrimitive.Root.displayName

const MenubarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <MenubarTriggerPrim
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-1 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      className
    )}
    {...props}
  />
))
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName

const MenubarSubTrigger = React.forwardRef<
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
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName

const MenubarSubContent = React.forwardRef<HTMLDivElement, ContentProps>(
  ({ className, ...props }, ref) => (
    <SubContentPrim
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-menubar-content-transform-origin]",
        className
      )}
      {...props}
    />
  )
)
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName

const MenubarContent = React.forwardRef<HTMLDivElement, ContentProps>(
  ({ className, align = "start", alignOffset = -4, sideOffset = 8, ...props }, ref) => (
    <MenubarPrimitive.Portal>
      <ContentPrim
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-menubar-content-transform-origin]",
          className
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
)
MenubarContent.displayName = MenubarPrimitive.Content.displayName

const MenubarItem = React.forwardRef<
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
MenubarItem.displayName = MenubarPrimitive.Item.displayName

const MenubarCheckboxItem = React.forwardRef<
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
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName

const MenubarRadioItem = React.forwardRef<
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
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName

const MenubarLabel = React.forwardRef<
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
MenubarLabel.displayName = MenubarPrimitive.Label.displayName

const MenubarSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <SeparatorPrim
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName

const MenubarShortcut = ({
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
MenubarShortcut.displayname = "MenubarShortcut"

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
}
