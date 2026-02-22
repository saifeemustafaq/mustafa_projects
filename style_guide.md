# Portfolio — Style Guide

A minimal style guide for the portfolio. UI is built **only** with [Shadcn UI](https://ui.shadcn.com) (New York style, neutral base). Use this doc to keep typography, color, spacing, and component usage consistent.

---

## 1. Design principles

- **Minimal** — Few elements; every one should earn its place.
- **Content-first** — Projects are the focus; UI supports, never competes.
- **Readable** — Clear hierarchy, comfortable contrast, and line length.
- **Consistent** — Same patterns for similar content (e.g. all project cards).

---

## 2. Typography

- **Fonts**: Use the app’s CSS variables. Default is `--font-sans` (e.g. Geist) for body and UI; `--font-mono` only for code or technical labels if needed.
- **Body**: Default size and `text-foreground`. No arbitrary font stacks; rely on `font-sans` / `font-mono` from the theme.
- **Headings**: Use a clear scale (e.g. `text-2xl`/`text-xl` for page titles, `text-lg` for section titles, `text-base` for card titles). Prefer `font-semibold` for headings, not bold.
- **Muted text**: Use `text-muted-foreground` for descriptions, dates, and secondary info (e.g. `CardDescription`, project meta).
- **Line length**: Cap long copy (e.g. project descriptions) so lines don’t exceed ~65–75 characters where possible.

---

## 3. Color

- **Semantic tokens only**: Use Shadcn theme variables, not raw hex/gray scale.
  - **Background / text**: `bg-background`, `text-foreground`.
  - **Surfaces**: `bg-card`, `text-card-foreground`; `bg-muted`, `text-muted-foreground` for subtle blocks.
  - **Actions**: `primary` for main CTAs; `secondary` or `outline` for secondary actions; `ghost` or `link` for low emphasis.
  - **Borders**: `border-border`; inputs use `border-input`, focus `ring-ring`.
- **Theme**: Neutral base; light/dark follow `prefers-color-scheme` (and optional `.dark` if you add a toggle). Do not introduce new palette colors unless you extend the theme in `globals.css` and `@theme inline` in a consistent way.

---

## 4. Spacing and layout

- **Grid / list**: Use a simple grid or stack for project cards (e.g. `grid grid-cols-1 md:grid-cols-2 gap-6` or similar). Keep gaps consistent (e.g. `gap-4` / `gap-6`).
- **Section spacing**: Use consistent vertical rhythm (e.g. `space-y-8` or `space-y-12` between sections).
- **Container**: Constrain main content width (e.g. `max-w-3xl` or `max-w-4xl`) and center for readability.
- **Padding**: Prefer Shadcn-consistent padding (e.g. card `px-6` / `py-6`). Avoid one-off padding values; reuse a small set (e.g. `p-4`, `p-6`).

---

## 5. Components (Shadcn only)

- **Button**: Use Shadcn `Button` only. Prefer `variant="default"` for primary, `variant="outline"` or `variant="ghost"` for secondary, `variant="link"` for text links. Use `size="default"` or `size="sm"`; avoid custom sizes unless necessary.
- **Card**: Use Shadcn `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` for project blocks. Keep structure consistent across all project cards.
- **New components**: Add only from Shadcn (`npx shadcn@latest add <component>`). Do not introduce custom UI primitives (e.g. custom buttons or cards); override with `className` or variants if needed.
- **Icons**: Use `lucide-react` as per `components.json`. Keep icon size consistent (e.g. default `size-4` with buttons, or `size-5` for standalone).

---

## 6. Motion and interaction

- **Transitions**: Rely on Shadcn’s built-in transitions (e.g. `transition-all` on buttons). Avoid custom animations unless needed for a specific, minimal effect.
- **Hover / focus**: Use Shadcn variants (e.g. `hover:bg-primary/90`). Don’t remove focus rings; keep `ring-ring` for accessibility.
- **Links**: External project links can use `Button asChild` with `<a>` or plain `<a>` with `variant="link"`. Ensure underline or clear affordance on hover.

---

## 7. Content and voice

- **Tone**: Professional and concise. Describe projects clearly without marketing fluff.
- **Project copy**: Short title, 1–2 sentence description, tech/tags if useful. Use `CardTitle` and `CardDescription` (or equivalent hierarchy).
- **Labels**: Use sentence case for UI labels (e.g. “View project”, “Source code”). Keep wording consistent across similar actions.

---

## 8. Technical notes

- **Theme**: Colors and radius are defined in `app/globals.css` (`:root` and `.dark`) and exposed via `@theme inline` for Tailwind. Shadcn components use these variables.
- **Utils**: Use `cn()` from `@/lib/utils` for merging class names.
- **Paths**: Components from `@/components/ui`; layout and pages in `app/`.

---

## Summary

| Area        | Rule of thumb                                      |
|------------|-----------------------------------------------------|
| Typography | Theme fonts only; semantic heading scale; muted for secondary text |
| Color      | Only theme tokens (background, foreground, card, muted, primary, etc.) |
| Spacing    | Consistent gap and section rhythm; constrained width |
| Components | Shadcn only; Button + Card for projects; Lucide icons |
| Motion     | Shadcn defaults; preserve focus styles               |
| Content    | Minimal, clear, sentence case                        |

This keeps the portfolio minimal, consistent, and easy to extend with new projects while staying within one design system (Shadcn).
