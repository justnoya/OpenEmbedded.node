// @ts-nocheck
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "../../lib/utils.js"

// Cast primitives to avoid Vercel TS 5.9 "className does not exist" errors.
type P<E, T> = React.ForwardRefExoticComponent<T & React.RefAttributes<E>>

const AvatarRootPrim = AvatarPrimitive.Root as P<HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { delayMs?: number }>

const AvatarImagePrim = AvatarPrimitive.Image as P<HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement> & { onLoadingStatusChange?: (status: string) => void }>

const AvatarFallbackPrim = AvatarPrimitive.Fallback as P<HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { delayMs?: number; forceMount?: true }>

const Avatar = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { delayMs?: number }
>(({ className, ...props }, ref) => (
  <AvatarRootPrim
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement> & { onLoadingStatusChange?: (status: string) => void }
>(({ className, ...props }, ref) => (
  <AvatarImagePrim
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { delayMs?: number; forceMount?: true }
>(({ className, ...props }, ref) => (
  <AvatarFallbackPrim
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
