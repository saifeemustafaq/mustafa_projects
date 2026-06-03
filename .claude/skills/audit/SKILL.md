---
name: audit
description: Audit-review code changes against an implementation plan and the DEVELOPER_GUIDE.md. Invoke when the user types /audit — optionally with a plan file (e.g. "@my-plan.md /audit") to check that the plan was fully and faithfully implemented; without a plan it reviews the recent changes made in the current session. Produces a structured pass/fail report covering plan completeness and developer-guide compliance.
---

# Audit Review

You are performing a rigorous **audit review**. Your job is NOT to write code — it is to verify, with evidence, that work that was already done is (1) complete relative to its plan and (2) compliant with the project's `DEVELOPER_GUIDE.md`. Be skeptical. An audit that rubber-stamps is worse than none.

## Step 0 — Determine the mode

Look at how the skill was invoked.

- **Plan mode** — the user referenced a plan file (e.g. `@some-plan.md /audit`, or named/pasted a plan). A plan file was provided.
- **Session mode** — `/audit` was run with no plan. Audit the changes made recently in *this* chat session.

If it is genuinely ambiguous whether a plan was provided, ask the user once which they want; otherwise infer and proceed.

## Step 1 — Establish the two reference points

**A. The intended work (the spec):**
- *Plan mode:* Read the plan file in full. Extract every concrete deliverable, requirement, file to touch, behavior, and acceptance criterion into a checklist. Treat each as an item you must verify independently.
- *Session mode:* Reconstruct what was supposed to happen from the conversation — the user's requests and the changes you/the assistant agreed to make. Build the same kind of checklist from those.

**B. The rules (the standard):**
- Always read `DEVELOPER_GUIDE.md` (in the repo root) in full. It is the single source of truth for structure, layering, server-actions-not-API-routes, the auth-check-first rule, the data-flow loop, naming, TypeScript conventions, styling tokens, etc. Use its "Quick checklist" table near the bottom as a concrete rubric.
- Also honor `CLAUDE.md` and `style_guide.md` if present and relevant.

## Step 2 — Establish what was actually done (the evidence)

Gather the real, current state of the code — never trust the plan's claims or the conversation's narration about what was done. Verify against files.

- Run `git status` and `git diff` (and `git diff --staged`) to see uncommitted changes.
- In session mode, also use `git log` / `git diff` against the session's starting point if changes were committed during the session.
- Read the actual changed files (not just the diff hunks) where you need surrounding context to judge correctness or convention compliance.
- For each checklist item from Step 1.A, locate the concrete code that satisfies it (cite `file_path:line`). If you cannot find it, it is **not done**.

## Step 3 — Audit against the plan (completeness & fidelity)

For every checklist item, classify it:

- ✅ **Done** — implemented as specified. Cite the file/lines.
- ⚠️ **Partial / Deviated** — implemented but incomplete, or done differently than the plan. Explain the gap and whether the deviation is reasonable or a problem.
- ❌ **Missing** — no evidence it was done.
- ➕ **Out-of-scope** — code changed that the plan did not call for (scope creep, or an undocumented decision). Flag it.

Also check: were things done that *contradict* the plan? Were assumptions made that the plan didn't authorize?

## Step 4 — Audit against the DEVELOPER_GUIDE (compliance)

Go through the guide's rules and check the changed code against each relevant one. At minimum, for this repo:

1. **Mutations are Server Actions** in `app/actions/*` with `"use server"` — no `app/api/route.ts` handlers added for normal CRUD.
2. **Auth check first.** Every mutating action calls `getSession()` before anything else and returns `{ success:false, error }` when null.
3. **Action shape.** Returns the `{ success:true } | { success:false; error }` discriminated union; never throws across the boundary for expected failures; model calls wrapped in `try/catch (err)` + `console.error`.
4. **Layering respected.** Component → action → model. Components/actions do not import `mongoose` or build queries; only `lib/models/` touches Mongoose.
5. **Model conventions.** `await connectDb()` first, `.lean()` reads, map docs to plain typed objects (`String(_id)`, default-coalesced optionals), `mongoose.models.X ?? mongoose.model(...)` guard.
6. **Refresh, not revalidate.** Client calls `router.refresh()` after success; no stray `revalidatePath`/`revalidateTag`.
7. **Edit mode.** New editable UI gates edit controls behind the `isEditMode` prop (not CSS); read-only view always renders.
8. **UI conventions.** shadcn/ui primitives (no hand-edits to `components/ui/`), Lucide icons only, no emoji, the dialog + `pending`/`error` handler pattern, `@dnd-kit` reuse for reorder.
9. **TypeScript.** Strict, avoid `any`, named exports (default only for `page.tsx`/`layout.tsx`), `import type`, `@/` path alias for cross-dir imports.
10. **Styling.** Semantic Tailwind oklch tokens (`bg-background`, `text-foreground`, …), no hardcoded hex/gray; new nav actions added to both header and mobile bar.
11. **Env & secrets** server-side only; `.env.example` kept in sync; no `NEXT_PUBLIC_*` secrets.
12. **Docs current.** If structure changed (new action/model/top-level UI), the structure tree in `DEVELOPER_GUIDE.md` was updated in the same change.

Treat the list above as a starting rubric, not exhaustive — read the guide and flag anything else it mandates that the change violates. For each finding, cite the rule (guide section) and the offending `file_path:line`.

## Step 5 — Verify, don't assume (when feasible)

If the change is testable and the tooling is available, run a lightweight verification: `tsc`/typecheck, lint, or the test suite. Report results. Do not start dev servers or make outward-facing calls without need. If you cannot verify something, say so explicitly rather than guessing.

## Step 6 — Report

Produce a concise, evidence-backed report in this structure:

```
# Audit Report — <plan name | "recent session changes">

## Verdict
PASS | PASS WITH ISSUES | FAIL  — one-line justification.

## Plan completeness
- ✅ / ⚠️ / ❌ / ➕ items, each with a file:line citation and a one-line note.

## Developer-guide compliance
- Findings grouped by severity. Each: rule (guide §), file:line, what's wrong, the fix.

## Severity summary
- 🔴 Blocking: must fix (breaks a hard rule, missing deliverable, security/auth gap).
- 🟡 Should-fix: convention deviations, partial work, missing doc updates.
- 🟢 Nits: style/optional.

## Verification
- typecheck/lint/test results, or why not run.

## Recommended next actions
- Ordered, specific, actionable.
```

Rules for the report:
- **Cite evidence for every claim** (`file_path:line`). No vague assertions.
- **Be decisive on the verdict.** A missing deliverable or a violated hard rule (e.g. a mutation with no `getSession()` check, a model imported directly into a component) is a FAIL, not a nit.
- **Do not fix anything** unless the user explicitly asks you to after seeing the report. The audit's output is the report.
- Keep it tight — findings over prose.
