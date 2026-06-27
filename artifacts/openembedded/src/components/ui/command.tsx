// @ts-nocheck
"use client"

import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "../../lib/utils.js"
import { Dialog, DialogContent } from "./dialog.js"

// Cast ALL cmdk primitives — Vercel TS 5.9 strips className/children from their prop types.
type P<E, T> = React.ForwardRefExoticComponent<T & React.RefAttributes<E>>

type CmdRootProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string
  onValueChange?: (value: string) => void
  filter?: (value: string, search: string, keywords?: string[]) => number
  shouldFilter?: boolean
  loop?: boolean
  disablePointerSelection?: boolean
  vimBindings?: boolean
  label?: string
}

const CmdRootPrim    = CommandPrimitive                  as P<HTMLDivElement,  CmdRootProps>
const CmdInputPrim   = CommandPrimitive.Input            as P<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>
const CmdListPrim    = CommandPrimitive.List             as P<HTMLDivElement,  React.HTMLAttributes<HTMLDivElement>>
const CmdEmptyPrim   = CommandPrimitive.Empty            as P<HTMLDivElement,  React.HTMLAttributes<HTMLDivElement>>
const CmdGroupPrim   = CommandPrimitive.Group            as P<HTMLDivElement,  React.HTMLAttributes<HTMLDivElement> & { heading?: React.ReactNode; value?: string; forceMount?: boolean }>
const CmdSepPrim     = CommandPrimitive.Separator        as P<HTMLDivElement,  React.HTMLAttributes<HTMLDivElement> & { alwaysRender?: boolean }>
const CmdItemPrim    = CommandPrimitive.Item             as P<HTMLDivElement,  React.HTMLAttributes<HTMLDivElement> & { value?: string; disabled?: boolean; onSelect?: (value: string) => void; keywords?: string[]; forceMount?: boolean }>

const Command = React.forwardRef<HTMLDivElement, CmdRootProps>(
  ({ className, ...props }, ref) => (
    <CmdRootPrim
      ref={ref}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
        className
      )}
      {...props}
    />
  )
)
Command.displayName = CommandPrimitive.displayName

const CommandDialog = ({ children, ...props }: DialogProps) => (
  <Dialog {...props}>
    <DialogContent className="overflow-hidden p-0">
      <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
        {children}
      </Command>
    </DialogContent>
  </Dialog>
)

const CommandInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <CmdInputPrim
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
)
CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <CmdListPrim
      ref={ref}
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
      {...props}
    />
  )
)
CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => (
    <CmdEmptyPrim ref={ref} className="py-6 text-center text-sm" {...props} />
  )
)
CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { heading?: React.ReactNode; value?: string }
>(({ className, ...props }, ref) => (
  <CmdGroupPrim
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
))
CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { alwaysRender?: boolean }
>(({ className, ...props }, ref) => (
  <CmdSepPrim
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: string; disabled?: boolean; onSelect?: (value: string) => void; keywords?: string[] }
>(({ className, ...props }, ref) => (
  <CmdItemPrim
    ref={ref}
    className={cn(
      "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className
    )}
    {...props}
  />
))
CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
    {...props}
  />
)
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
