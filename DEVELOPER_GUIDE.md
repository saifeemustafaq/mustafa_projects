# Mustafa Projects — Developer Guide

Project-specific rules for structure, data flow, and conventions in this portfolio app. Follow these unless there's a clear reason to deviate.

This app is a single-page **AI portfolio** with an inline **edit mode** for the owner. Visitors see projects, an about section, and contact links; the logged-in admin edits everything in place. There is **no separate admin route** and **no public API** — mutations run through Next.js **Server Actions**, and reads happen in **Server Components**.

This is the single source of truth for how to build in this repo. For visual language specifics, see [`style_guide.md`](style_guide.md).

---

## 1. Tech stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Runtime | React | 19.2.3 |
| Language | TypeScript (strict mode) | 5 |
| UI | shadcn/ui (new-york style, neutral base) + Tailwind CSS | v4 |
| Icons | Lucide React | — |
| Database | MongoDB via **Mongoose** (ODM, not the native driver) | mongoose 9 |
| Auth | JWT via `jose` (HS256), password hashing via `bcryptjs` | — |
| Theming | `next-themes` (light / dark / system) | — |
| Fonts | Geist Sans + Geist Mono (`next/font/google`) | — |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` (reorder projects + experiences) | — |
| Markdown | `react-markdown` + `remark-gfm` (PRD viewer, experience bios) | — |
| Image hosting | GitHub Contents API (branch → PR → squash merge → raw URL) | — |
| Deployment | Netlify | — |

### Two big architectural facts

1. **Server Actions, not API routes.** There is no `app/api/` directory. Every mutation (create/update/delete/login/upload) is a function in `app/actions/*.ts` marked `"use server"`. Do not add `route.ts` handlers unless you have a reason a server action genuinely can't cover (e.g. a webhook receiver).

2. **No `proxy.ts` / no `middleware.ts`.** Auth is **not** enforced at the edge. Each server action that mutates data calls `getSession()` as its first step and returns an error result if there's no session. Public reads (projects, about, links) run unguarded in server components. If you add a new mutation, **you are responsible for the auth check inside it** — there is no global guard to fall back on.

---

## 2. Project structure

```
mustafa_projects/
├── app/
│   ├── layout.tsx              # Root layout: Geist fonts, ThemeProvider, metadata
│   ├── page.tsx                # Home (server component): parallel data fetch → LandingContent
│   ├── globals.css             # Tailwind v4 + shadcn theme tokens (oklch, light/dark)
│   ├── landing-content.tsx     # "use client" top-level shell: header, search, view/sort, dialogs
│   ├── about-section.tsx       # About: bio + experience buttons, edit dialogs, dnd reorder
│   ├── project-display.tsx     # ProjectCard, ProjectListRow, SortableProjectListRow
│   ├── project-form-modals.tsx # AddProjectModal, EditProjectModal (+ ProjectUrlField)
│   ├── settings-modals.tsx     # SettingsModal (login/logout), EditSiteLinksModal
│   ├── contact-dialog.tsx      # ContactDialog (view + edit modes)
│   ├── image-uploader.tsx      # Gallery image picker: multi-file upload + URL-append (drives upload actions)
│   ├── style/page.tsx          # Living design-guide reference page (/style)
│   └── actions/                # ── ALL mutations live here (Server Actions) ──
│       ├── auth.ts             # login / logout
│       ├── projects.ts         # create / update / delete / reorder projects
│       ├── about-info.ts       # bio + experience CRUD + reorder
│       ├── site-links.ts       # LinkedIn / GitHub / contact info
│       ├── upload-image.ts     # GitHub image upload: batch (≤5, <5.9MB) → one commit → PR → merge
│       └── fetch-markdown.ts   # Fetch + cache GitHub markdown for the PRD viewer
├── components/
│   ├── ui/                     # shadcn-generated primitives — do NOT edit by hand
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── input.tsx
│   ├── theme-provider.tsx      # next-themes wrapper (mounted in root layout)
│   ├── theme-toggle.tsx        # Sun/Moon switch
│   ├── project-image-carousel.tsx # Auto-sliding multi-image carousel + lightbox for ProjectCard
│   └── prd-viewer-dialog.tsx   # Renders GitHub md inline / Google Drive pdf in iframe
├── lib/
│   ├── mongodb.ts              # connectDb() — cached Mongoose connection singleton
│   ├── auth.ts                 # createSession / getSession / destroySession (jose JWT cookie)
│   ├── utils.ts                # cn() helper
│   ├── prd-utils.ts            # detectPrdUrlType + GitHub raw / Drive embed URL converters
│   └── models/                 # ── data layer: Mongoose schemas + query functions ──
│       ├── Project.ts          # Project schema + getProjects/create/update/reorder/delete + seed
│       ├── User.ts             # User schema + ensureAdminUser/verifyCredentials/setPassword
│       ├── AboutInfo.ts        # Single-doc about (photo, bio, experiences[])
│       └── SiteLinks.ts        # Single-doc site/contact links
├── scripts/                    # plain-JS ops scripts (run with `node`, not via the app)
│   ├── reset-password.js       # Reset/create admin password in MongoDB
│   ├── backfill-image-url.js   # One-time backfill of imageUrl on existing projects
│   └── README.md
├── public/                     # static assets + uploaded project images (folder-per-project)
├── PRD.md                      # Product requirements
├── style_guide.md              # Visual style guide
├── DEVELOPER_GUIDE.md          # This file (single source of truth)
├── next.config.ts              # serverActions.bodySizeLimit = 6mb (for image uploads)
├── components.json             # shadcn config (new-york, neutral, lucide)
└── .env.example                # Documented env vars (copy to .env.local)
```

### Grouping philosophy

- **Three clear layers, top to bottom:** Server Component / Client Component → Server Action (`app/actions/`) → Model (`lib/models/`). Data flows down through these layers; never skip one (e.g. a component must not import a model directly to mutate data — go through an action).
- **Co-locate UI by feature, not by type.** Project UI (`project-display.tsx`, `project-form-modals.tsx`) lives in `app/`, next to the page that uses it. Only genuinely shared/cross-cutting components (theme, PRD viewer) live in `components/`.
- **`lib/models/` is the only place that touches Mongoose.** Schemas, queries, and document→plain-object mapping all live here.

### Keeping this diagram current

When you add a server action, a model, or a top-level UI module, **update this tree in the same change**. A stale structure section is worse than none.

---

## 3. Data flow (read this before touching anything)

The whole app follows one loop. Internalize it:

```
1. READ   app/page.tsx (Server Component) calls getSession() + model read
          functions in parallel via Promise.all, passes plain objects as
          props into <LandingContent /> (Client Component).

2. RENDER LandingContent decides isEditMode = initialLoggedIn. Edit
          affordances (Add / Edit / Delete / drag handles) only render
          when logged in.

3. MUTATE A client handler calls a Server Action from app/actions/*.
          The action: getSession() guard → validate → call a lib/models/
          function → return { success } | { success:false, error }.

4. REFRESH On success the client calls router.refresh(). This re-runs the
          server component, re-reads the DB, and streams fresh props down.
          On failure it shows result.error (inline <p> or alert()).
```

**Why `router.refresh()` instead of `revalidatePath`?** Server actions here do **not** call `revalidatePath`/`revalidateTag`. State lives in the DB, the page is dynamic, and the client explicitly refreshes after a successful mutation. Keep this pattern — don't sprinkle `revalidatePath` into actions unless you're deliberately changing the model.

---

## 4. Server Actions (`app/actions/`)

This is the heart of the app. Every action file starts with `"use server"`.

### Mandatory action shape

```ts
"use server";

import { getSession } from "@/lib/auth";
import { doThing } from "@/lib/models/Thing";

export type DoThingResult = { success: true } | { success: false; error: string };

export async function doThing(/* args or _prev, formData */): Promise<DoThingResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "You must be logged in to ..." };
  }

  // validate inputs (trim, required-field checks) ...

  try {
    await doThing(/* ... */);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to ..." };
  }
}
```

### Mandatory rules

1. **Auth check first.** Any action that writes data calls `getSession()` before doing anything else and returns a `{ success: false, error }` result if it's null. The only mutation action that intentionally runs before login is `login` itself (and `ensureAdminUser` inside it).
2. **Return results, don't throw.** Actions return a discriminated union `{ success: true; ... } | { success: false; error: string }`. The UI branches on `result.success`. Never let an action throw across the server/client boundary for an expected failure.
3. **Wrap model calls in try/catch.** Name the catch variable `err` and `console.error(err)` (or `console.error("context:", err)` for the GitHub upload). Then return a user-safe error string.
4. **Validate and trim inputs at the action boundary.** `(formData.get("name") as string)?.trim()`, required-field checks, etc. Don't trust the client.
5. **One concern per action; delegate persistence to a model.** Actions orchestrate (auth → validate → call model → shape result). They do not build Mongoose queries inline. The exceptions are `upload-image.ts` (talks to the GitHub API directly — that's its domain) and `fetch-markdown.ts` (fetches a URL).
6. **Don't `revalidatePath`.** The client calls `router.refresh()` after success (see §3).

### Two input styles (both are fine, be deliberate)

- **`FormData` actions** — used where there's a real `<form>` with many fields: `login`, `createProject`, `updateProject`, `uploadImageToGitHub`. Signature is `(_prev: unknown, formData: FormData)` for the form ones (compatible with `useActionState`, though the app currently calls them directly from an `onSubmit` handler).
- **Plain-argument actions** — used for small, typed payloads: `updateSiteLinks(linkedin, github, email, phone, location)`, `addExperience(company, content)`, `reorderProjects(orderedIds)`, `deleteProject(id)`.

Use `FormData` when the form is large and field-driven; use typed args when the payload is small and known. Don't convert one to the other without reason.

### Checkbox / boolean fields from FormData

HTML checkboxes serialize as the string `"on"` (or absent). Parse them as `formData.get("prdEnabled") === "on"`. See `createProject`/`updateProject`.

---

## 5. Data layer (`lib/models/`)

All MongoDB access goes through Mongoose models defined here. **No other directory imports `mongoose`.**

### Connection singleton

`lib/mongodb.ts` exports `connectDb()`, which caches the Mongoose connection on `globalThis.mongoose` to survive hot reloads in dev and reuse the connection across serverless invocations. **Every model query function calls `await connectDb()` first.** Never call `mongoose.connect()` anywhere else.

```ts
import { connectDb } from "@/lib/mongodb";

export async function getProjects(): Promise<Project[]> {
  await connectDb();
  const docs = await ProjectModel.find().sort({ order: 1 }).lean();
  return docs.map(/* → plain Project */);
}
```

### Model registration pattern

Re-registering a Mongoose model throws on hot reload, so guard it:

```ts
export const ProjectModel =
  mongoose.models.Project ?? mongoose.model("Project", projectSchema);
```

`SiteLinks.ts` deliberately does the opposite — it `delete`s the cached model and re-registers so schema edits take effect on hot reload. That's intentional for a frequently-evolving single-doc schema; copy the `??` pattern for normal models and only use the delete-and-recreate trick when you're actively iterating on a schema.

### Return plain objects, never raw Mongoose docs

Model functions **map documents to plain, typed objects** before returning (e.g. `Project`, `AboutInfo`, `SiteLinks`). This is required because the results are passed from server components into client components as props, which must be serializable.

- Always `.lean()` reads.
- Convert `_id` to a string `id`: `id: String(d._id)`.
- Coalesce optionals with sensible defaults: `imageUrl: d.imageUrl ?? ""`, `prdEnabled: d.prdEnabled !== false`.
- Never return a `mongoose.Document` or `ObjectId` across the boundary.

### Two collection shapes

- **List collections** — `Project` (many docs, ordered by an integer `order` field).
- **Singleton collections** — `AboutInfo` and `SiteLinks` are **single-document** collections. Read with `findOne()`, write with `findOneAndUpdate({}, { $set: ... }, { upsert: true })`. Treat them as "the one settings doc."

### Ordering convention

Reorderable lists (projects, experiences) use an integer `order` field, displayed `sort({ order: 1 })`. Reordering is done by writing each item's new index via `reorderProjectsById(orderedIds)` / `reorderExperiencesById`. The single-step `reorderProject(id, "up"|"down")` swaps `order` with the adjacent neighbor. Keep new reorderable entities on this same `order`-index model.

### Seeding

`getProjects()` returns `[]` on an empty DB; `app/page.tsx` then calls `seedDummyProjects()` once and re-reads. `seedDummyProjects` is idempotent (`countDocuments() > 0` guard). Don't seed from anywhere else.

---

## 6. Auth & sessions (`lib/auth.ts`, `lib/models/User.ts`)

- **Single admin user.** There is one user, username `admin`. There is no signup. `ensureAdminUser()` creates it from `INITIAL_ADMIN_PASSWORD` on first login if it doesn't exist; passwords are later rotated via `scripts/reset-password.js`.
- **Session = signed JWT cookie.** `createSession(username)` signs an HS256 JWT (`jose`) with a 7-day expiry and stores it in an `httpOnly`, `sameSite=lax` cookie named `portfolio_session` (`secure` in production).
- **`getSession()` is the gate.** It reads + verifies the cookie and returns `{ username } | null`. Call it at the top of every mutating server action and in server components that need to know if edit mode is on.
- **Passwords** are hashed with `bcryptjs` (cost 10). `bcryptjs` is imported dynamically (`await import("bcryptjs")`) inside the functions that need it to keep it out of the edge/client bundle. Keep doing this.
- **`AUTH_SECRET`** signs the JWT. It has a dev fallback string; **it must be set in production** or sessions are forgeable.

There is no logout-everywhere or refresh-token concept — `destroySession()` just deletes the cookie. Keep auth this simple unless the product needs multi-user.

---

## 7. Edit mode (the core UX pattern)

There is no `/admin` page. "Edit mode" is simply: **is there a valid session?**

- `app/page.tsx` passes `initialLoggedIn={!!session}` into `LandingContent`, which sets `const isEditMode = initialLoggedIn`.
- `isEditMode` is threaded down as a prop to `ProjectCard`, `ProjectListRow`, `AboutSection`, `ContactDialog`, etc.
- Edit affordances (Add project, Edit/Delete icons, drag handles, "EDIT MODE" banner, bio/experience editors) render **only** when `isEditMode` is true. Public visitors get read-only UI.

When you add a new editable entity, follow this: render the read-only view always, and gate the edit controls behind the `isEditMode` prop. Never rely on hiding controls with CSS — they shouldn't be in the tree at all for visitors, and the server action's `getSession()` check is the real security boundary regardless.

---

## 8. UI components & client/server split

- **Server components by default.** `app/page.tsx` and `app/layout.tsx` are server components. They do data fetching and pass props down.
- **`"use client"` for anything interactive.** Every file under `app/` except `page.tsx`, `layout.tsx`, and `style/page.tsx` is a client component (state, dialogs, dnd, handlers). Mark them with `"use client"` at the top.
- **shadcn/ui is the design system.** Use the primitives in `components/ui/` (`Button`, `Card`, `Dialog`, `Input`). Add more with `npx shadcn@latest add <name>`. **Do not hand-edit files in `components/ui/`** — wrap them in a new component if you need custom behavior.
- **Icons: Lucide React only.** Default `size-4` inside buttons, `size-5` for standalone. No emoji in UI or copy. (One legacy inline `<svg>` drag-dots icon exists in `about-section.tsx`; prefer `GripVertical` from Lucide for new drag handles, as `project-display.tsx` does.)
- **Dialogs are the primary interaction surface.** Add/Edit/Settings/Contact/PRD/image-zoom are all shadcn `Dialog`s. The pattern: parent owns `open` state (`useState`) and renders `<Dialog open={x} onOpenChange={setX}>` with a content component inside. Content components receive `onOpenChange` and an `onSaved`/`onAdded` callback (which is usually `router.refresh()`).
- **Textareas** are raw `<textarea>` elements (shadcn has no textarea here) styled with a shared `TEXTAREA_CLASS` constant or an inline class string. If textareas proliferate, add the shadcn `textarea` component instead of copying the class string again.

### Client-side mutation handler pattern

Every form/handler that calls an action follows this shape — match it:

```tsx
const [pending, setPending] = useState(false);
const [error, setError] = useState<string | null>(null);

async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setError(null);
  setPending(true);
  const result = await someAction(/* ... */);
  setPending(false);
  if (result.success) {
    onSaved();          // usually router.refresh() + close dialog
    onOpenChange(false);
  } else {
    setError(result.error);
  }
}
```

- Disable the submit button while `pending` and show a label like `"Saving…"` / a `Loader2` spinner.
- Show `error` inline as `<p className="text-sm text-destructive">`.
- Destructive actions (delete) use `confirm(...)` then `alert(result.error)` on failure. This is acceptable for this small admin-only surface; don't introduce a toast library just for these.

---

## 9. Image uploads (`app/actions/upload-image.ts` + `app/image-uploader.tsx`)

Projects hold a **gallery** of images (`imageUrls: string[]`, with `imageUrl` kept synced as the cover `imageUrls[0]` for backward compatibility). Each image is either a **pasted URL** or a **file committed into the repo's `public/` folder via the GitHub API**. `ImageUploader` is shared by the project modals (multi-image) and the bio photo editor (which constrains the gallery to a single cover image via `defaultUrls={photo ? [photo] : []}` / `onValuesChange={(urls) => setPhoto(urls[0] ?? "")}`).

### Hard caps: 5 images, < 5.9 MB per upload (the 6 MB limit)

Server Actions run as **AWS Lambda functions on Netlify**, which cap a **synchronous request body at 6 MB** — a hard platform limit, not a plan tier. Raising `serverActions.bodySizeLimit` past ~6 MB does nothing on Netlify. Rather than engineer around it, the uploader enforces two caps so the entire batch always fits in **one** request:

- **`MAX_IMAGES = 5`** — a project gallery holds at most 5 images (enforced on both the upload tab and the URL-append tab).
- **`MAX_TOTAL_UPLOAD_SIZE = 5.9 MB`** — the combined size of one upload batch. The ~0.1 MB headroom under 6 MB absorbs multipart boundary overhead. Each file is also capped at 5 MB individually.

If a selection would exceed 5 images, the extra files are dropped with a notice; if the batch exceeds 5.9 MB, the upload button is disabled and the user is told to remove a file or upload smaller images. These limits live as constants in **both** `image-uploader.tsx` (client UX) and `upload-image.ts` (server safety) — keep them in sync, and both under `serverActions.bodySizeLimit`.

The single upload action: **`uploadImagesToGitHub(formData)`** reads `files` (multiple) + `folderName`, runs the `getSession()` guard + config check, validates the batch (count ≤ 5, total < 5.9 MB, each ≤ 5 MB, all `image/*`, folder matches `SAFE_NAME_RE` `^[a-zA-Z0-9_-]+$`), derives a safe **unique** filename per file (sanitize + `-2`/`-3` dedupe), then commits everything in **one push** via the GitHub **Git Data API**: create a blob per file → one `POST /git/trees` on the base tree → one `POST /git/commits` → create `image-upload-<timestamp>` branch → open PR → squash-merge → delete branch (best-effort, in a `finally`). Returns one `raw.githubusercontent.com/.../main/...` URL per file. (Per-file base64 inflation is on the *outbound* server→GitHub calls, which have no 6 MB cap.)

Conventions:
- The gallery is persisted as the project's `imageUrls` array via a hidden `<input name="imageUrls" value={JSON.stringify(imageUrls)}>` synced from `ImageUploader`'s `onValuesChange`. The server action `parseImageUrls` reads the JSON (with a legacy single-`imageUrl` fallback). The images themselves live in git, not the DB.
- `ImageUploader` shows **fake stepped progress** (`UPLOAD_STEPS`) on a 2.5s interval because the single upload request is opaque and slow. If you change the action's steps, update that array to keep the UX honest.
- Names are `sanitize()`-d and de-duplicated client-side, and re-validated server-side against `SAFE_NAME_RE`. Keep both — client sanitize/dedupe for UX, server regex for safety.
- If GitHub env vars are missing, uploads fail gracefully with a clear message and the URL-append tab still works. Image upload is an **optional** feature; never make core flows depend on it.

---

## 10. PRD viewer & external links (`lib/prd-utils.ts`, `components/prd-viewer-dialog.tsx`)

Each project has four optional links (PRD / PPT / GitHub / Demo), each with an `xEnabled` toggle. Buttons render disabled when missing or disabled.

The **PRD link is special** — `detectPrdUrlType(url)` classifies it:

| Type | Detection | Behavior |
|------|-----------|----------|
| `github-md` | `github.com` host + path ends `.md` | Fetched server-side via `fetchMarkdownContent` (converts to `raw.githubusercontent.com`, `revalidate: 300`), rendered inline with `react-markdown` + `remark-gfm` in a dialog |
| `google-drive-pdf` | `drive.google.com/file/d/...` | Embedded in an `<iframe>` using the `/preview` URL |
| `external` | anything else | Opens in a new tab (`asChild` `<a target="_blank">`) |

When you add a new "viewable" content type, extend `PrdUrlType` + `detectPrdUrlType` and add a branch in `PRDViewerDialog`. Keep URL-transform helpers (`toGitHubRawUrl`, `toGoogleDriveEmbedUrl`) pure and in `prd-utils.ts`.

External links always use `target="_blank" rel="noopener noreferrer"` and an `aria-label`. Match this.

---

## 11. Drag-and-drop reorder (`@dnd-kit`)

Projects (list view) and experiences are reorderable when in edit mode. The pattern (see `LandingContent` and `AboutSection`):

- `PointerSensor` with `activationConstraint: { distance: 8 }` so clicks aren't hijacked.
- `DndContext` → `SortableContext` (vertical for projects, horizontal for experiences) → sortable rows that expose a drag handle button with `{...attributes} {...listeners}`.
- `onDragEnd`: compute new order with `arrayMove`, call the reorder action with the ordered id array, then `router.refresh()` on success or `alert()` on failure.
- Reorder is **only enabled in the default sort mode** (`sortBy === "default"`). When the user sorts A–Z / Z–A, the order is derived, so drag is disabled.

Reuse this exact wiring for any new reorderable list; don't introduce a second drag library.

---

## 12. Code organization (file size, DRY, when to split)

Baseline rules for structure and reuse. Follow these unless there's a clear reason to deviate.

### Structure & ownership

- **One component/feature per file.** Each component or feature lives in its own file with a single, nameable responsibility. Ask: "What is this file's job?"
- **Group by feature/domain, not just by type.** UI for a feature lives next to the page that uses it (`project-display.tsx`, `project-form-modals.tsx` in `app/`); only genuinely cross-cutting components go in `components/`.

### DRY

- **Reuse first.** Before adding code, check for an existing component, helper, or model function you can reuse (e.g. `ImageUploader` is shared by project modals *and* the bio editor; `ProjectLinkButtons` serves both card and list views).
- **Extract only when used by ≥ 2 distinct modules.** A helper used by a single module stays co-located in that file or folder — don't push it to a global "shared" location for one consumer.
- **Watch for duplication across actions.** If two server actions reimplement the same validation or parsing, extract it.

### File size (LOC)

- **Target most source files ≤ 300 lines.** LOC is a signal, not the goal — going over is fine when it improves cohesion (one clear flow in one file, e.g. `about-section.tsx`).
- **Don't split just to hit 300** if the result is worse: more files to open, duplicated types, circular deps, or pass-through wrappers.
- **Heuristic:** if you must open 3+ files to follow one flow, you've probably over-split.
- **Exception:** shadcn-generated files in `components/ui/` may exceed 300 lines — don't refactor them.

### When to split

Split only on a **real boundary**: different responsibilities (validation vs. persistence vs. UI), a stable interface (action vs. model), a reusable component with a clear owner, or a nameable domain sub-area. Every new file must answer: **"What is its single responsibility?"**

### Imports & dependencies

- **Limit import sprawl.** If a file has > ~15 imports after a refactor, reconsider the structure.
- **No dependency cycles.** Splitting should not introduce circular deps or deep import chains. If it does, revert or restructure. The layering (component → action → model) keeps this clean — respect the one-directional flow.

---

## 13. TypeScript & conventions

- **Strict mode is on.** Don't weaken `tsconfig.json`.
- **Avoid `any`.** Where FormData/JSON values are read, cast narrowly (`as string`) and immediately `?.trim()` / validate; prefer `unknown` + narrowing for anything structured.
- **Result unions over throwing** for action return types (see §4).
- **Path alias `@/*`** maps to the project root. Use `@/lib/...`, `@/components/...`, `@/app/...` for cross-directory imports; relative imports only within the same directory.
- **`import type`** for type-only imports (`import type { Project } from "@/lib/models/Project"`).
- **Exports:** `export default` **only** for Next.js `page.tsx` / `layout.tsx`. Everything else — components, actions, models, helpers, types — uses **named exports**.

### Naming

| Category | Convention | Examples |
|----------|-----------|----------|
| Action / util / hook files | kebab-case | `upload-image.ts`, `prd-utils.ts`, `project-display.tsx` |
| Model files | PascalCase (matches the model) | `Project.ts`, `AboutInfo.ts`, `SiteLinks.ts` |
| Components | PascalCase | `ProjectCard`, `ImageUploader`, `PRDViewerDialog` |
| Functions / vars | camelCase | `getProjects`, `connectDb`, `detectPrdUrlType` |
| Types | PascalCase | `Project`, `AboutInfo`, `CreateProjectInput`, `PrdUrlType` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `SAFE_NAME_RE`, `UPLOAD_STEPS` |

Note the deliberate split: **model files are PascalCase** (named after the Mongoose model they export), **everything else is kebab-case**. Keep this.

---

## 14. Styling

- **Tailwind v4, no config file.** Theme tokens live in `app/globals.css` via `@theme inline` + `:root`/`.dark` CSS variables in the **oklch** color space. There is no `tailwind.config.ts`.
- **Semantic tokens only.** Use `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-card`, `text-destructive`, `bg-primary`, etc. Don't hardcode hex or gray-scale values. (The few `text-green-600` / `text-red-600` success/edit-mode accents are intentional status colors — keep new ones to genuine status semantics.)
- **`cn()` for conditional classes** when composing dynamically. Note: a lot of existing code uses template-literal class strings for simple conditional toggles (view-mode tabs, upload tabs). Prefer `cn()` from `@/lib/utils` for new conditional composition; it's cleaner and merge-safe.
- **Mobile-first & responsive.** The layout is constrained to `max-w-4xl`, and there's a **fixed bottom action bar on mobile** (`sm:hidden`) mirroring the desktop header buttons. Any new top-level nav action must be added to both the header and the mobile bar (see `LandingContent`).
- **Dark mode** is driven by `next-themes` (`attribute="class"`, `defaultTheme="system"`). The `ThemeProvider` is mounted once in `app/layout.tsx`; `ThemeToggle` guards against hydration mismatch with a `mounted` flag — replicate that guard in any component that reads `resolvedTheme`.

The `/style` route (`app/style/page.tsx`) is a **living reference** of typography/color/components. Update it when you add or change shared visual patterns.

---

## 15. Environment variables

Documented in `.env.example`; real values go in `.env.local` (git-ignored). Keep `.env.example` in sync when you add a variable.

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGODB_URI` | **Yes** | Mongoose connection string. Without it, the app throws on first DB access. |
| `INITIAL_ADMIN_PASSWORD` | Once | Sets the `admin` password on first login if the user doesn't exist. Remove/blank after. |
| `AUTH_SECRET` | Production | Secret for signing the session JWT. Has an insecure dev fallback — **must** be set in prod. |
| `GITHUB_TOKEN` | No | PAT with `repo` scope, enables in-app image upload. |
| `GITHUB_OWNER` | No | Repo owner for image upload (e.g. `saifeemustafaq`). |
| `GITHUB_REPO` | No | Repo name for image upload (e.g. `mustafa_projects`). |

Read env vars only on the server (actions, models, `lib/auth.ts`). Never expose secrets to the client; there are no `NEXT_PUBLIC_*` vars and there shouldn't need to be.

`next.config.ts` sets `serverActions.bodySizeLimit = "6mb"`. Image upload sends the whole batch in one request, capped at **≤ 5 images and < 5.9 MB total** (see §9) precisely so it fits. Don't raise this past ~6 MB to allow bigger batches — Server Actions run as AWS Lambda on Netlify, whose synchronous request body is capped at 6 MB regardless of plan. If you change the image size caps (`MAX_FILE_SIZE` / `MAX_TOTAL_UPLOAD_SIZE` / `MAX_IMAGES`), keep them mirrored between `upload-image.ts` and `image-uploader.tsx`, and keep the batch total below this limit.

---

## 16. Scripts (`scripts/`)

Operational scripts are **plain JavaScript**, run directly with `node` (not through the app, not TypeScript). They manually parse `.env.local` and use `require()` + the raw collection name — they don't use the `@/` alias or the Mongoose models. This is deliberate: they're standalone ops tools.

- `npm run reset-password "NewPass123"` (or `NEW_PASSWORD=... node scripts/reset-password.js`) — upserts the `admin` password hash. Requires `MONGODB_URI`.
- `node scripts/backfill-image-url.js` — one-time backfill of the `imageUrl` field. Idempotent.

When adding a new ops script, follow the same self-contained style and document it in `scripts/README.md`.

---

## 17. Error handling

- **Server actions:** wrap model calls in `try/catch (err)`, `console.error(err)`, return `{ success: false, error: "<user-safe message>" }`. Never leak raw error text or stack traces to the client. A couple of `about-info` actions use a bare `catch { ... }` — prefer `catch (err)` + `console.error` for new code so failures are debuggable in server logs.
- **Models:** generally let errors propagate up to the calling action (which catches them). The exception is the reorder helpers, which `try/catch` and return a `boolean` so a partial reorder failure is surfaced as a clean `false`.
- **Client:** branch on `result.success`. Show inline `text-destructive` errors in forms; use `confirm()`/`alert()` only for the lightweight delete flows.

---

## 18. Deployment (Netlify)

- Hosted on Netlify. Set every variable from `.env.example` under **Site configuration → Environment variables** — especially `MONGODB_URI` and `AUTH_SECRET`.
- Server Actions run as serverless functions. The `connectDb()` global cache reuses the Mongoose connection across invocations — don't break that singleton or you'll exhaust DB connections.
- Uploaded images are committed into the repo's `public/` folder via the GitHub API, so a deploy that includes them serves the images statically. The DB only stores the raw URL.

---

## Quick checklist

| Do | Don't |
|----|-------|
| Mutate data only through `app/actions/*` Server Actions | Add `app/api/route.ts` handlers for normal CRUD |
| Call `getSession()` first in every mutating action | Assume a global guard protects you (there's no `proxy.ts`) |
| Return `{ success } | { success:false, error }` from actions | Throw across the server/client boundary for expected failures |
| Touch Mongoose only in `lib/models/` | Import `mongoose` or build queries in actions/components |
| `await connectDb()` at the top of every model query | Call `mongoose.connect()` anywhere else |
| Map docs to plain typed objects (`String(_id)`, defaults) | Return raw Mongoose docs / `ObjectId`s as props |
| `router.refresh()` after a successful mutation | Sprinkle `revalidatePath` into actions |
| Gate edit controls behind the `isEditMode` prop | Rely on CSS to hide admin controls from visitors |
| Use shadcn/ui + Lucide; default server components | Hand-edit `components/ui/`, use emoji, or add icon libraries |
| Reuse the dialog + `pending`/`error` handler pattern | Invent a new state/feedback pattern per form |
| Reuse the `@dnd-kit` reorder wiring for new lists | Add a second drag-and-drop library |
| Keep secrets server-side; sync `.env.example` | Add `NEXT_PUBLIC_*` secrets or undocumented env vars |
| Use `@/` imports, named exports, `import type` | Default-export non-pages or use deep relative paths |
| Use semantic Tailwind tokens (oklch theme vars) | Hardcode hex / gray-scale colors |
| Add new nav actions to both header and mobile bar | Leave the mobile bottom bar out of sync |
| Keep this guide + the structure tree current | Let the docs drift from the code |

---

*Keep this guide open when adding features or refactoring. When in doubt, follow the existing action → model → refresh loop.*
