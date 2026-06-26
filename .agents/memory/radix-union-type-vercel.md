---
name: Radix union type Vercel fix
description: Why toggle/toggle-group lose children+className under Vercel's TypeScript checker, and the permanent fix pattern.
---

## The Problem

Vercel's post-build TypeScript checker scans `artifacts/openembedded/tsconfig.json` (which includes `src/**/*`). Under the specific combination of TypeScript 5.9 + React 18 + `@radix-ui/react-toggle-group`, the type:

```ts
React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
```

resolves to:

```ts
Omit<ToggleGroupSingleProps & RefAttributes<HTMLDivElement>, "ref"> | Omit<ToggleGroupMultipleProps & RefAttributes<...>, "ref">
```

This is a **union type**. In React 18, `children` is no longer implicitly added to all component props. If neither `ToggleGroupSingleProps` nor `ToggleGroupMultipleProps` explicitly declares `children?: ReactNode`, the union loses `children`. TypeScript then refuses any JSX that passes `children` to the component.

Same mechanism caused `className` to be missing from `@radix-ui/react-toggle`'s `ToggleProps` under Vercel's environment.

## Root Cause

- React 18 removed the implicit `children` prop from `React.FC` and component types
- `@radix-ui/react-toggle-group` uses two separate interfaces (`Single | Multiple`) which TypeScript evaluates as a strict union
- Accessing any property on a union requires it to be common to ALL members; if neither side declares `children`, the union has no `children`

## The Fix Pattern (permanent)

**Never use `ComponentPropsWithoutRef<typeof SomeRadixPrimitive>` as the base for casts.** Instead, use standard React HTML attribute types which always carry `children` and `className`:

```tsx
// For div-based primitives (ToggleGroup.Root, etc.)
type ToggleGroupRootProps = React.HTMLAttributes<HTMLDivElement> &
  React.RefAttributes<HTMLDivElement> & {
    // Radix-specific props explicitly listed
    type?: "single" | "multiple"
    value?: string | string[]
    // ...
  }
const ToggleGroupRoot = ToggleGroupPrimitive.Root as React.ForwardRefExoticComponent<ToggleGroupRootProps>

// For button-based primitives (Toggle.Root, ToggleGroup.Item, etc.)
type ToggleRootProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.RefAttributes<HTMLButtonElement> & {
    pressed?: boolean
    // ...
  }
const ToggleRoot = TogglePrimitive.Root as React.ForwardRefExoticComponent<ToggleRootProps>
```

`React.HTMLAttributes<T>` and `React.ButtonHTMLAttributes<T>` always include `children` (via `DOMAttributes<T>`) and `className` under any TypeScript configuration.

**Why:** `DOMAttributes<T>` in `@types/react` explicitly declares `children?: ReactNode` — this is a stable React type, not derived from component prop inference. It will never lose these props regardless of module resolution or TypeScript version.

**How to apply:** Any shadcn/ui component that wraps a Radix primitive with a union prop type (recognizable by `Single | Multiple` in its type docs) must use this pattern. Components with a single-interface Radix type (Select, Dialog, Tabs, etc.) are safe with `ComponentPropsWithoutRef`.

## Components Fixed

- `artifacts/openembedded/src/components/ui/toggle.tsx` — `ToggleRoot` cast via `React.ButtonHTMLAttributes<HTMLButtonElement>`
- `artifacts/openembedded/src/components/ui/toggle-group.tsx` — `ToggleGroupRoot` via `React.HTMLAttributes<HTMLDivElement>`, `ToggleGroupItemRoot` via `React.ButtonHTMLAttributes<HTMLButtonElement>`
- `artifacts/openembedded/src/components/ui/toast.tsx` — all six Toast primitives (Viewport/Root/Action/Close/Title/Description) cast via HTML attribute types; Radix-specific props (altText, open, onOpenChange, type, duration, forceMount, hotkey, label, swipe handlers) explicitly typed in the cast interfaces

## Radix packages with union prop types (potential future risk)

- `@radix-ui/react-toggle-group` — ToggleGroupSingleProps | ToggleGroupMultipleProps ← FIXED
- `@radix-ui/react-toast` — ToastViewportProps, ToastProps, etc. lose className under TS 5.9 ← FIXED
- `@radix-ui/react-accordion` — AccordionSingleProps | AccordionMultipleProps (Root re-exported as-is, not wrapped, so only consumer files are at risk — but Accordion is not used in this app)
