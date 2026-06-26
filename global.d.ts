// Declare Vite's import.meta.env for projects scanned without vite/client types.
// Values are always strings at runtime (Vite inlines them at build time).
interface ImportMeta {
  readonly env: Record<string, string>;
}
