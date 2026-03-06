# Product Requirements Document (PRD)

## Mustafa's AI Portfolio

| Field | Details |
|---|---|
| **Product Name** | Mustafa's AI Portfolio |
| **Document Version** | 1.0 |
| **Last Updated** | March 6, 2026 |
| **Author** | Mustafa Saifee |
| **Status** | Live / Iterating |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Pain Points](#3-pain-points)
4. [Solution Overview](#4-solution-overview)
5. [Jobs To Be Done (JTBD)](#5-jobs-to-be-done-jtbd)
6. [Target Users & Personas](#6-target-users--personas)
7. [User Journeys](#7-user-journeys)
8. [Use Cases](#8-use-cases)
9. [Feature Requirements](#9-feature-requirements)
10. [Information Architecture](#10-information-architecture)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Tech Stack & Architecture](#12-tech-stack--architecture)
13. [Data Model](#13-data-model)
14. [Success Metrics & KPIs](#14-success-metrics--kpis)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Future Roadmap](#16-future-roadmap)
17. [Appendix](#17-appendix)

---

## 1. Executive Summary

Mustafa's AI Portfolio is a single-page web application that serves as a curated, self-managed showcase of AI/ML projects. Unlike generic portfolio templates or static resume sites, it is purpose-built for a product-minded engineer who needs to present project work alongside its full lifecycle artifacts — PRDs, slide decks, source code, and live demos — in a single, visually cohesive interface.

The application provides two distinct experiences: a **public visitor mode** optimized for browsing, searching, and consuming project information, and a **protected admin mode** that enables full content management (CRUD, reordering, link management) without leaving the page.

---

## 2. Problem Statement

### The Core Problem

Technical professionals building AI/ML products struggle to present the breadth of their work in a way that communicates both technical depth and product thinking. Existing solutions force trade-offs:

- **GitHub profiles** showcase code but lack narrative, product context, and visual presentation.
- **Resume sites / personal websites** are static, difficult to maintain, and rarely structured to highlight project artifacts like PRDs or presentations.
- **Portfolio builders (Notion, Behance, etc.)** are designed for designers or generalists and don't support the artifact taxonomy that matters for AI/PM roles (PRD, PPT, Demo, Code).
- **LinkedIn** constrains the presentation format and buries project details behind a rigid layout.

### Problem Statement (Concise)

> *There is no lightweight, self-hosted portfolio tool purpose-built for AI/ML product builders that allows them to showcase projects alongside their full artifact chain (PRD → Presentation → Code → Demo) while maintaining full control over content, ordering, and presentation.*

---

## 3. Pain Points

| # | Pain Point | Severity | Who Feels It |
|---|---|---|---|
| **PP-1** | Scattered artifacts — PRDs live in Google Docs, code on GitHub, decks on Drive, demos on various hosts. Recruiters and stakeholders have to chase multiple links. | High | Visitor, Admin |
| **PP-2** | Context collapse — GitHub repos strip away the "why" (product thinking, strategy, requirements) and only show the "what" (code). | High | Admin |
| **PP-3** | Maintenance overhead — Updating a static portfolio site requires code changes, deploys, and context-switching for every new project. | Medium | Admin |
| **PP-4** | Inflexible presentation order — Most portfolio tools sort chronologically or alphabetically, not by strategic relevance or impact. | Medium | Admin |
| **PP-5** | Broken discovery flow — Visitors have to open multiple tabs and leave the portfolio to consume a PRD or slide deck. | Medium | Visitor |
| **PP-6** | Professional branding gap — Generic templates don't convey the employer-caliber experience (Microsoft, AWS, Intuit, Harness, CMU) that differentiates a candidate. | Low | Admin |

---

## 4. Solution Overview

The application addresses these pain points through five design pillars:

### 4.1 Unified Project Hub

Each project is a first-class entity with four artifact slots — **PRD**, **PPT**, **GitHub**, and **Demo** — each independently linkable and toggleable. Visitors see a single card or row with all relevant actions surfaced inline.

### 4.2 Inline Document Viewer

GitHub-hosted Markdown PRDs render directly inside a modal dialog (with full GFM support: tables, task lists, strikethrough). Google Drive PDFs embed as previews. Visitors consume artifacts without leaving the page, preserving the browsing flow.

### 4.3 Zero-Friction Admin CMS

Authenticated admins manage everything from the same page they present to the public — no separate admin panel, no CMS dashboard. Add, edit, delete, and reorder projects via modals and drag-and-drop. The entire CRUD lifecycle happens in-context.

### 4.4 Flexible Discovery

Client-side search with instant filtering, sort toggling (Default / A-Z / Z-A), and switchable layouts (Cards / List) give visitors control over how they browse.

### 4.5 Professional Identity Layer

Employer logos (Microsoft, AWS, Intuit, Harness) and educational affiliation (CMU) are displayed in the header, establishing credibility at a glance. Social profile links (LinkedIn, GitHub) are admin-configurable and prominently placed.

---

## 5. Jobs To Be Done (JTBD)

### Primary JTBD — Admin (Portfolio Owner)

| # | Job Statement | Outcome |
|---|---|---|
| **J-1** | *When I complete a new AI project, I want to add it to my portfolio with all its artifacts so that recruiters and peers can evaluate my full-stack product thinking.* | Project appears immediately with PRD, PPT, GitHub, and Demo links. |
| **J-2** | *When I'm preparing for a job application, I want to reorder my projects to lead with the most relevant work so that the hiring manager sees my strongest signal first.* | Drag-and-drop reordering persists across sessions. |
| **J-3** | *When a project's demo goes offline or a repo goes private, I want to disable specific links without deleting the project so that visitors don't hit dead ends.* | Per-link enable/disable toggles without data loss. |
| **J-4** | *When I update my social profiles, I want to change the LinkedIn and GitHub links from the same interface so that I don't have to touch code.* | Site-wide links update instantly via a modal. |

### Primary JTBD — Visitor (Recruiter / Hiring Manager / Peer)

| # | Job Statement | Outcome |
|---|---|---|
| **J-5** | *When I land on the portfolio, I want to quickly scan all projects and understand what each one does so that I can decide which ones to explore deeper.* | Card/list view with name, description, and image at a glance. |
| **J-6** | *When I find an interesting project, I want to read its PRD without leaving the page so that I can evaluate the candidate's product sense in-flow.* | Inline Markdown/PDF viewer opens in a dialog. |
| **J-7** | *When I'm looking for a specific type of project, I want to search by keyword so that I can find relevant work fast.* | Real-time search across project names and descriptions. |
| **J-8** | *When I want to learn more about the person, I want to quickly jump to their LinkedIn or GitHub so that I can cross-reference their professional profile.* | Header-level social links open in a new tab. |

---

## 6. Target Users & Personas

### Persona 1: The Portfolio Owner (Admin)

| Attribute | Details |
|---|---|
| **Name** | Mustafa (primary user) |
| **Role** | AI/ML Product Builder — engineer with PM instincts |
| **Goal** | Present a cohesive narrative of AI projects that demonstrates both technical execution and product strategy |
| **Frustration** | Every other portfolio tool is either too generic (no artifact taxonomy) or too heavy (WordPress, CMS fatigue) |
| **Tech Comfort** | High — deploys and maintains the app, but wants day-to-day content management to require zero code changes |

### Persona 2: The Recruiter / Hiring Manager

| Attribute | Details |
|---|---|
| **Name** | Sarah |
| **Role** | Technical recruiter at a FAANG-tier company |
| **Goal** | Evaluate a candidate's project depth, product thinking, and code quality in under 5 minutes |
| **Frustration** | Candidate portfolios are either walls of text (Notion) or just GitHub links with no context |
| **Tech Comfort** | Medium — comfortable browsing websites, expects things to "just work" |

### Persona 3: The Peer / Collaborator

| Attribute | Details |
|---|---|
| **Name** | Alex |
| **Role** | Fellow AI engineer or grad school peer |
| **Goal** | Explore projects for inspiration, check out the PRD methodology, or evaluate collaboration potential |
| **Frustration** | Hard to tell what someone actually built vs. what they just starred on GitHub |
| **Tech Comfort** | High |

---

## 7. User Journeys

### Journey 1: Recruiter Evaluates a Candidate (Happy Path)

```
Sarah receives Mustafa's portfolio link in an email
    │
    ▼
Lands on the portfolio — sees the project grid with images,
employer logos (Microsoft, AWS…) in the header
    │
    ▼
Scans 4–6 project cards. Notices "AI Tax Assistant" has
a PRD, PPT, GitHub, and Demo link
    │
    ▼
Clicks "PRD" — an inline Markdown viewer opens showing
the full product requirements document with tables and specs
    │
    ▼
Impressed by the product thinking. Closes the dialog.
Clicks "GitHub" to skim the code architecture
    │
    ▼
Returns to the portfolio. Clicks "LinkedIn" in the header
to cross-reference work history
    │
    ▼
Adds Mustafa to the interview pipeline
```

**Key Moments of Truth:**
- First impression (< 3 seconds): Does the page look credible and professional?
- Artifact access (< 1 click): Can I see the PRD without leaving the page?
- Signal density: Do I get name + description + image + all artifact links in a single card?

---

### Journey 2: Admin Adds a New Project

```
Mustafa finishes building a new AI project and has the
PRD on GitHub, slides on Google Drive, and a live demo
    │
    ▼
Opens the portfolio. Clicks the hidden gear icon (⚙)
    │
    ▼
Signs in with admin credentials → page shows "EDIT MODE"
    │
    ▼
Clicks "+ Add project" → fills in name, description,
image URL, and pastes artifact links (PRD, PPT, GitHub, Demo)
    │
    ▼
Toggles off "Demo" (demo is still being polished) → saves
    │
    ▼
New project appears in the grid. Switches to list view,
drags the new project to the top of the list
    │
    ▼
Logs out → page returns to visitor mode with the new project
prominently displayed at the top
```

---

### Journey 3: Admin Manages Existing Content

```
Mustafa's demo for "Document Summarizer" goes offline
    │
    ▼
Logs in → clicks the pencil icon (✏) on the project card
    │
    ▼
Unchecks the "Demo" toggle (keeps the URL for later) → saves
    │
    ▼
The Demo button now appears disabled for visitors — no broken link
    │
    ▼
While logged in, updates LinkedIn URL via the header "LinkedIn"
button → edits the URL in the modal → saves
    │
    ▼
Logs out. Both changes are live immediately
```

---

### Journey 4: Visitor Searches and Filters

```
Alex lands on the portfolio looking for NLP-related projects
    │
    ▼
Types "summarizer" in the search bar → list filters in real-time
    │
    ▼
Switches to list view for a compact scan. Sorts A–Z
    │
    ▼
Clicks on "Document Summarizer" PRD → reads the inline Markdown
    │
    ▼
Opens the GitHub link in a new tab to review the codebase
```

---

## 8. Use Cases

### UC-1: View Project Portfolio (Visitor)

| Field | Details |
|---|---|
| **Actor** | Visitor |
| **Precondition** | Portfolio has at least one project |
| **Trigger** | Visitor navigates to the portfolio URL |
| **Main Flow** | 1. Page loads with all projects in card view (default). 2. Visitor sees project cards with image, name, description, and artifact buttons (PRD, PPT, GitHub, Demo). 3. Disabled buttons indicate unavailable artifacts. |
| **Alternate Flow** | If no projects exist, the system seeds dummy projects for demonstration. |
| **Postcondition** | Visitor can browse, search, sort, and switch views. |

### UC-2: Search Projects (Visitor)

| Field | Details |
|---|---|
| **Actor** | Visitor |
| **Precondition** | Portfolio has projects |
| **Trigger** | Visitor types in the search input |
| **Main Flow** | 1. Input filters projects in real-time by name and description (case-insensitive). 2. Non-matching projects are hidden. 3. "No projects match your search" message appears when zero results. |
| **Postcondition** | Only matching projects are displayed. Clearing the input restores the full list. |

### UC-3: View PRD Inline (Visitor)

| Field | Details |
|---|---|
| **Actor** | Visitor |
| **Precondition** | Project has a PRD URL pointing to a GitHub `.md` file or Google Drive PDF |
| **Trigger** | Visitor clicks the "PRD" button |
| **Main Flow (GitHub MD)** | 1. A full-screen dialog opens. 2. A loading spinner appears while the Markdown is fetched server-side. 3. Rendered Markdown (with GFM tables, checkboxes, etc.) is displayed. 4. An "Open in new tab" link is available in the dialog header. |
| **Main Flow (Google Drive PDF)** | 1. A full-screen dialog opens. 2. The PDF is embedded via Google Drive's preview iframe. |
| **Alternate Flow (External URL)** | The PRD button opens the URL directly in a new tab. |
| **Postcondition** | Visitor has consumed the document without navigating away. |

### UC-4: Authenticate as Admin

| Field | Details |
|---|---|
| **Actor** | Admin |
| **Precondition** | Admin user exists in the database |
| **Trigger** | Admin clicks the hidden settings gear icon |
| **Main Flow** | 1. Settings dialog opens with username and password fields. 2. Admin enters credentials and clicks "Sign in". 3. On success, the dialog closes and the page displays "EDIT MODE" with edit controls. 4. A JWT session cookie is set (HTTP-only, 7-day expiry). |
| **Error Flow** | Invalid credentials display an error message within the dialog. |
| **Postcondition** | Admin has full CRUD access. |

### UC-5: Add Project (Admin)

| Field | Details |
|---|---|
| **Actor** | Authenticated Admin |
| **Precondition** | Admin is logged in (EDIT MODE active) |
| **Trigger** | Admin clicks "+ Add project" |
| **Main Flow** | 1. A modal form opens with fields: Name, Description, Image URL, PRD URL, PPT URL, GitHub URL, Demo URL. 2. Each artifact URL has an enable/disable toggle (default: enabled). 3. Admin fills in details and clicks "Add project". 4. The project is persisted to MongoDB and the page refreshes to show it. |
| **Validation** | Name and Description are required. |
| **Postcondition** | New project is visible to visitors. |

### UC-6: Edit Project (Admin)

| Field | Details |
|---|---|
| **Actor** | Authenticated Admin |
| **Trigger** | Admin clicks the pencil icon on a project |
| **Main Flow** | 1. Edit modal opens pre-populated with existing values. 2. Admin modifies fields and/or toggles artifact visibility. 3. Admin clicks "Save changes". 4. The project is updated in the database. |
| **Postcondition** | Changes are immediately visible to visitors. |

### UC-7: Delete Project (Admin)

| Field | Details |
|---|---|
| **Actor** | Authenticated Admin |
| **Trigger** | Admin clicks the trash icon on a project |
| **Main Flow** | 1. A browser confirmation dialog appears: `Delete "Project Name"?`. 2. On confirm, the project is deleted from the database. 3. The page refreshes. |
| **Postcondition** | Project is permanently removed. |

### UC-8: Reorder Projects via Drag-and-Drop (Admin)

| Field | Details |
|---|---|
| **Actor** | Authenticated Admin |
| **Precondition** | List view is active, sort order is "Default" |
| **Trigger** | Admin grabs the drag handle (⠿) on a project row |
| **Main Flow** | 1. Admin drags the row to the desired position. 2. On drop, the new order is sent to the server. 3. Order values are persisted to the database. |
| **Constraint** | Drag-and-drop is only available in list view with default sort order to prevent conflicting sort operations. |
| **Postcondition** | New order is reflected for all visitors. |

### UC-9: Manage Social Profile Links (Admin)

| Field | Details |
|---|---|
| **Actor** | Authenticated Admin |
| **Trigger** | Admin clicks the "LinkedIn" or "GitHub" button in the header |
| **Main Flow** | 1. Site links modal opens with LinkedIn URL and GitHub URL fields. 2. Admin updates URLs and clicks "Save". 3. Links are persisted (upsert on a single-document collection). |
| **Postcondition** | Header social buttons link to the updated URLs for all visitors. |

### UC-10: View Full Project Image (Visitor)

| Field | Details |
|---|---|
| **Actor** | Visitor |
| **Precondition** | Project has an image URL |
| **Trigger** | Visitor clicks the project image in card view |
| **Main Flow** | 1. A full-size image dialog opens (90vw max width). 2. Visitor can close the dialog to return to the portfolio. |
| **Postcondition** | Visitor has seen the full-resolution project image. |

---

## 9. Feature Requirements

### P0 — Must Have (Shipped)

| ID | Feature | Description |
|---|---|---|
| **F-1** | Project CRUD | Create, read, update, and delete projects with all metadata fields |
| **F-2** | Artifact Link Taxonomy | Four artifact types per project (PRD, PPT, GitHub, Demo) with independent URLs and enable/disable toggles |
| **F-3** | Inline PRD Viewer | Render GitHub Markdown and Google Drive PDFs inside a dialog without navigation |
| **F-4** | Search | Real-time client-side filtering by project name and description |
| **F-5** | View Modes | Toggle between Card view (2-column grid with images) and List view (compact rows) |
| **F-6** | Sort Options | Default (manual order), Alphabetical A-Z, Alphabetical Z-A |
| **F-7** | Drag-and-Drop Reorder | Reorder projects via drag handles in list view (admin only, default sort only) |
| **F-8** | Admin Authentication | JWT-based single-admin login via HTTP-only cookie with 7-day session |
| **F-9** | Edit Mode UX | Inline edit controls (pencil, trash, add button) visible only when authenticated |
| **F-10** | Site Links Management | Admin-configurable LinkedIn and GitHub profile URLs displayed in the header |
| **F-11** | Employer / Education Branding | Logo strip in the header showing employer and university logos |
| **F-12** | Dark Mode | Automatic dark mode support via `prefers-color-scheme` |
| **F-13** | Responsive Design | Fully responsive layout for mobile, tablet, and desktop |
| **F-14** | Image Lightbox | Click-to-expand project images in a full-size dialog |
| **F-15** | Description Truncation | Long descriptions truncate with a "read more" dialog to preserve card layout |
| **F-16** | Dummy Data Seeding | Auto-seed 4 demo projects when the database is empty for first-run experience |

### P1 — Should Have (Planned)

| ID | Feature | Description |
|---|---|---|
| **F-17** | Analytics Dashboard | Track page views, project click-through rates, and PRD view counts |
| **F-18** | Project Tags / Categories | Categorize projects by domain (NLP, Computer Vision, etc.) with filterable tags |
| **F-19** | Project Detail Page | Dedicated route per project for richer long-form content and SEO |

### P2 — Nice to Have (Future)

| ID | Feature | Description |
|---|---|---|
| **F-20** | Multi-user Support | Allow multiple portfolio owners with separate profiles |
| **F-21** | Custom Domain Mapping | Support vanity domains per portfolio |
| **F-22** | Export / Share | Generate a PDF or shareable snapshot of the portfolio |

---

## 10. Information Architecture

```
┌─────────────────────────────────────────────────────┐
│  HEADER                                             │
│  ┌─────────────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Brand Name      │  │ Employer │  │ Social     │ │
│  │ + Edit Mode     │  │ Logos    │  │ Links +    │ │
│  │   Badge         │  │ + CMU   │  │ Settings   │ │
│  └─────────────────┘  └──────────┘  └────────────┘ │
├─────────────────────────────────────────────────────┤
│  TOOLBAR                                            │
│  ┌──────────────────────┐  ┌────────┐ ┌──────────┐ │
│  │ Search Input          │  │ View   │ │ Sort     │ │
│  │                       │  │ Toggle │ │ Toggle   │ │
│  └──────────────────────┘  └────────┘ └──────────┘ │
├─────────────────────────────────────────────────────┤
│  CONTENT AREA                                       │
│                                                     │
│  Card View:                                         │
│  ┌──────────┐ ┌──────────┐                          │
│  │  Image   │ │  Image   │                          │
│  │  Name    │ │  Name    │                          │
│  │  Desc    │ │  Desc    │                          │
│  │ PRD|PPT| │ │ PRD|PPT| │                          │
│  │ GH|Demo │ │ GH|Demo │                          │
│  │ [✏][🗑] │ │ [✏][🗑] │  ← Admin only            │
│  └──────────┘ └──────────┘                          │
│                                                     │
│  List View:                                         │
│  ┌─ ⠿ ─ Name ── Desc ── PRD|PPT|GH|Demo ─ [✏][🗑]┐│
│  ├─ ⠿ ─ Name ── Desc ── PRD|PPT|GH|Demo ─ [✏][🗑]┤│
│  └─ ⠿ ─ Name ── Desc ── PRD|PPT|GH|Demo ─ [✏][🗑]┘│
│         ↑ drag handle (admin + default sort only)   │
└─────────────────────────────────────────────────────┘
```

---

## 11. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Page load (LCP) under 2 seconds on 4G. Client-side search must feel instant (< 100ms). |
| **Security** | JWT stored in HTTP-only cookie (XSS-resistant). All mutations require server-side session verification. Password hashed with bcrypt. No REST API surface — server actions only (reduced attack surface). |
| **Accessibility** | ARIA labels on all interactive elements. Keyboard-navigable tabs, dialogs, and drag handles. Focus management for modals. `prefers-color-scheme` respected automatically. |
| **SEO** | Server-side rendered initial page load (Next.js SSR). Semantic HTML structure. |
| **Reliability** | MongoDB connection pooling with cached connections. Graceful error handling on failed markdown fetches. |
| **Maintainability** | Single-page architecture reduces routing complexity. Component composition follows React best practices. Radix UI primitives ensure accessible, unstyled dialog/form foundations. |
| **Scalability** | Single-admin design is intentional (personal portfolio). Database can support hundreds of projects without pagination due to low volume. |

---

## 12. Tech Stack & Architecture

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **UI Library** | React 19, Radix UI, Tailwind CSS 4 |
| **Database** | MongoDB (Mongoose 9 ODM) |
| **Authentication** | JWT via `jose`, bcryptjs for password hashing |
| **Drag-and-Drop** | `@dnd-kit/core` + `@dnd-kit/sortable` |
| **Markdown Rendering** | `react-markdown` + `remark-gfm` |
| **Icons** | Lucide React |
| **Hosting** | Vercel (assumed, Next.js native) |

### Architecture Pattern

- **Server Components**: `page.tsx` fetches session, projects, and site links server-side, then hydrates the client component.
- **Client Components**: `LandingContent` and all interactive UI (search, modals, drag-and-drop) run client-side.
- **Server Actions**: All mutations (CRUD, auth, reorder) use Next.js `"use server"` actions — no REST API routes.
- **No Middleware**: Authentication is checked per-action, not via route middleware.

---

## 13. Data Model

### Project

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `name` | String | Yes | — | Project display name |
| `description` | String | Yes | — | Short project description |
| `imageUrl` | String | No | `""` | Project thumbnail / hero image |
| `prdUrl` | String | No | `""` | Link to PRD (GitHub MD, Drive PDF, or external) |
| `pptUrl` | String | No | `""` | Link to presentation |
| `githubUrl` | String | No | `""` | Link to source code |
| `demoUrl` | String | No | `""` | Link to live demo |
| `prdEnabled` | Boolean | No | `true` | Controls PRD button visibility |
| `pptEnabled` | Boolean | No | `true` | Controls PPT button visibility |
| `githubEnabled` | Boolean | No | `true` | Controls GitHub button visibility |
| `demoEnabled` | Boolean | No | `true` | Controls Demo button visibility |
| `order` | Number | No | `0` | Manual sort order |
| `createdAt` | Date | Auto | — | Timestamp |
| `updatedAt` | Date | Auto | — | Timestamp |

### User

| Field | Type | Required | Notes |
|---|---|---|---|
| `username` | String | Yes | Unique; single admin: `"admin"` |
| `passwordHash` | String | Yes | bcrypt hash |

### SiteLinks (Singleton)

| Field | Type | Default | Notes |
|---|---|---|---|
| `linkedinUrl` | String | `""` | LinkedIn profile URL |
| `githubUrl` | String | `""` | GitHub profile URL |

---

## 14. Success Metrics & KPIs

### Primary Metrics

| Metric | Definition | Target |
|---|---|---|
| **Portfolio Click-Through Rate** | % of visitors who click at least one artifact link (PRD, PPT, GitHub, Demo) | > 40% |
| **PRD Engagement Rate** | % of visitors who open the inline PRD viewer and stay for > 30 seconds | > 20% |
| **Time to First Interaction** | Median time from page load to first click (search, sort, view toggle, or artifact link) | < 10 seconds |
| **Content Freshness** | Time between new project completion and portfolio addition | < 48 hours |

### Secondary Metrics

| Metric | Definition | Target |
|---|---|---|
| **Bounce Rate** | % of visitors who leave without any interaction | < 30% |
| **Multi-Project Exploration** | % of visitors who view artifacts from 2+ projects | > 25% |
| **Admin Session Efficiency** | Average time to add a new project (login → save → logout) | < 3 minutes |

---

## 15. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **GitHub raw URL rate limiting** | Medium | High — PRD viewer fails silently | Server-side fetch with caching; display clear error state with "Open in new tab" fallback |
| **Google Drive embed blocked by CORS / org policy** | Medium | Medium — PDF viewer shows blank iframe | Detect failure and suggest opening in new tab |
| **Single admin lockout** (forgotten password, no recovery flow) | Low | High — content cannot be updated | `reset-password` CLI script available; ENV-based initial password |
| **MongoDB connection limits** (serverless cold starts) | Low | Medium — slow page loads | Mongoose connection caching; connection pooling |
| **SEO limitations** (single-page, client-rendered content area) | Medium | Low — portfolio is link-shared, not search-discovered | Server-side initial render provides base content; metadata tags in layout |
| **Image hotlinking failures** (external image URLs go stale) | Medium | Low — "No image" fallback shown | Graceful fallback UI; admin can update URLs anytime |

---

## 16. Future Roadmap

### Phase 2 — Discovery & Analytics

- **Project tags and filtering** (e.g., NLP, Computer Vision, GenAI)
- **View analytics** (page views, artifact clicks per project)
- **OG meta tags** per project for rich social sharing previews

### Phase 3 — Content Depth

- **Project detail pages** with long-form write-ups, embedded videos, and architecture diagrams
- **Blog / case study** section for deeper narratives
- **Changelog / version history** per project

### Phase 4 — Platform

- **Multi-portfolio support** for teams or cohorts
- **Custom theming** (color schemes, layout options)
- **PDF export** of the full portfolio as a leave-behind document
- **API access** for headless integrations (embedding portfolio in other sites)

---

## 17. Appendix

### A. PRD URL Detection Logic

The system classifies PRD URLs into three types to determine rendering behavior:

| URL Pattern | Type | Behavior |
|---|---|---|
| `github.com/**/*.md` | `github-md` | Fetch raw Markdown server-side, render with GFM in a dialog |
| `drive.google.com/file/d/*` | `google-drive-pdf` | Embed via Drive preview iframe in a dialog |
| All other URLs | `external` | Open directly in a new browser tab |

### B. Seed Data (First-Run Projects)

When the database is empty, the application seeds four placeholder projects to demonstrate the interface:

1. AI Tax Assistant
2. Document Summarizer
3. Code Review Bot
4. Meeting Notes Generator

These can be edited or deleted by the admin after first login.

### C. Environment Configuration

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `INITIAL_ADMIN_PASSWORD` | No | Password for auto-creating the admin user on first login |
| `AUTH_SECRET` | No | JWT signing secret (falls back to a dev-only default) |

### D. Admin Scripts

| Script | Command | Purpose |
|---|---|---|
| Reset Password | `npm run reset-password <new-password>` | Resets the admin password directly in the database |
