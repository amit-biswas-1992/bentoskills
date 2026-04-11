# bentoskills.sh — Design Spec

**Date:** 2026-04-11
**Status:** Approved (v1 scope)
**Domain:** bentoskills.sh
**Codename:** `bentoskills`

---

## 1. Product

**bentoskills.sh** is a consumer-focused marketplace for UI/UX-flavored Claude Code agent skills (e.g. `design-critique`, `accessibility-review`, `ux-copy`, `design-handoff`, `design-system`, `user-research`).

It is the place a designer or design-engineer goes to discover, evaluate, and install agent skills that improve their UI/UX work — and the reference example of what a design-credible developer marketplace should look like.

### v1 jobs the product does

1. **Discover** — homepage with featured / trending / new, category and tag browsing, full-text search.
2. **Evaluate** — skill detail page with rendered README, metadata, author, version, license, and a link to source on GitHub.
3. **Install** — copy-paste install command (`npx bentoskills install <slug>`) plus a manual-install accordion for users without the CLI. The CLI itself is **not** built in v1; only the command string and manual instructions exist.
4. **Track** — signed-in users can favorite skills, see their install history, and revisit them from `/me`.
5. **Stay fresh** — a cron route syncs skill metadata from a public GitHub registry repo every 15 minutes.

### Explicit non-goals (v1)

- No ratings, reviews, or comments.
- No real CLI package on npm.
- No creator dashboard, no in-product publishing flow. Publishing is "open a PR to the registry repo" with a documented `skill.yaml` schema.
- No collections, no curation surfaces beyond `featured`.
- No payments, no private skills, no organizations.
- No email, no notifications.
- No Sentry, no analytics beyond Vercel Analytics page views.

---

## 2. Architecture & Stack

**Single Next.js 15 application (App Router, TypeScript strict).** No separate backend service. Next.js API routes replace what would otherwise be a NestJS layer.

### Stack

- **Next.js 15** — App Router, React Server Components, Route Handlers
- **TypeScript** — strict mode
- **TypeORM** + **PostgreSQL 16** — entities, migrations, repository pattern
- **Auth.js (NextAuth v5)** — GitHub OAuth provider, sessions persisted in Postgres via the TypeORM adapter
- **Tailwind CSS v4** + **shadcn/ui** — component base, customized for design credibility
- **Zod** — input validation on every API route and the registry parser
- **Octokit** — GitHub REST client for the registry sync
- **gray-matter** + **remark** + **rehype** + **rehype-sanitize** + **shiki** — README rendering
- **Postgres `tsvector`** — full-text search (no separate search service in v1)
- **pino** — structured logging
- **Vitest** + **Playwright** + **Testcontainers** — testing
- **Vercel** for hosting, **Supabase Postgres** for the database, **Vercel Cron** for the registry sync

### Top-level layout

```
/app
  /(marketing)
    page.tsx                   # /
    /skills/page.tsx           # /skills (browse)
    /skills/[slug]/page.tsx    # /skills/<slug> (detail)
    /tags/[tag]/page.tsx
    /search/page.tsx
    /publish/page.tsx          # static publish-a-skill docs (MDX)
  /(app)
    /me/page.tsx
    /me/favorites/page.tsx
    /me/installs/page.tsx
  /api
    /auth/[...nextauth]/route.ts
    /skills/route.ts                 # GET search/list (typeahead)
    /skills/[slug]/route.ts          # GET detail (JSON)
    /favorites/route.ts              # POST
    /favorites/[slug]/route.ts       # DELETE
    /installs/route.ts               # POST
    /cron/sync-registry/route.ts     # POST, CRON_SECRET protected
  error.tsx
  not-found.tsx
  layout.tsx
/lib
  /db
    data-source.ts                   # singleton TypeORM DataSource
    /entities                        # User, Account, Session, Skill, Favorite, InstallLog
    /migrations
    /repositories                    # SkillRepository, UserRepository, FavoriteRepository, InstallLogRepository
  /registry
    github.ts                        # Octokit wrapper, ETag-aware
    parser.ts                        # skill.yaml + README parser, Zod schema
    sync.ts                          # sync algorithm (pure, testable)
  /auth
    options.ts                       # authOptions
    server.ts                        # getServerSession helpers
  /search
    query.ts                         # tsvector query builders
  /api
    handler.ts                       # withErrorHandler wrapper
    errors.ts                        # NotFound, Unauthorized, ValidationError
  logger.ts                          # pino instance
/components
  /ui                                # shadcn primitives
  bento-grid.tsx
  skill-card.tsx
  command-block.tsx
  search-bar.tsx
  markdown-view.tsx
  category-nav.tsx
  tag-pill.tsx
  empty-state.tsx
  pagination.tsx
  auth-button.tsx
  favorite-button.tsx
  user-menu.tsx
/content
  /publish.mdx
  /about.mdx
/docs/superpowers/specs/...           # this file lives here
```

### Key isolation boundaries

- **`lib/registry`** has zero Next.js imports. Pure functions. Unit-testable in isolation with Octokit mocked.
- **`lib/db/repositories`** is the only layer that touches TypeORM entities. API routes and RSC pages call repositories, never raw query builders or `getRepository()`. This keeps routes thin and lets the storage layer evolve independently.
- **`lib/api/handler.ts`** wraps every API route handler. No route handler does its own try/catch.

### TypeORM + Next.js notes

- DataSource is a singleton stored on `globalThis._dataSource` to survive HMR in dev.
- Migrations run via `pnpm db:migrate`, never at request time.
- Entities use a `BaseEntity` mixin with `id` (uuid), `createdAt`, `updatedAt`.

---

## 3. Data Model

Six entities. All extend `BaseEntity` (`id` uuid PK, `createdAt`, `updatedAt`) unless otherwise noted.

### `User`

| column | type | notes |
|---|---|---|
| `id` | uuid | PK |
| `githubId` | bigint | unique, indexed |
| `username` | text | unique (GitHub login) |
| `name` | text | nullable |
| `avatarUrl` | text | nullable |
| `email` | text | nullable |

### `Account` (NextAuth adapter)

Standard NextAuth columns (`provider`, `providerAccountId`, `access_token`, `refresh_token`, `expires_at`, `token_type`, `scope`, `id_token`, `session_state`). FK `userId` → `User`, indexed.

### `Session` (NextAuth adapter)

Standard NextAuth columns: `sessionToken` (unique), `userId` (FK, indexed), `expires`.

### `Skill`

| column | type | notes |
|---|---|---|
| `id` | uuid | PK |
| `slug` | text | unique, indexed |
| `name` | text | display name |
| `tagline` | text | ≤140 chars, shown on cards |
| `description` | text | full README markdown |
| `version` | text | semver |
| `author` | text | GitHub login of skill author |
| `repoUrl` | text | canonical GitHub URL to skill folder |
| `homepageUrl` | text | nullable |
| `licenseSpdx` | text | nullable |
| `category` | text | indexed; one of: `accessibility`, `critique`, `copy`, `handoff`, `research`, `system` |
| `tags` | text[] | free-form, GIN-indexed |
| `installCount` | int | default 0, denormalized |
| `favoriteCount` | int | default 0, denormalized |
| `featured` | boolean | default false, indexed |
| `publishedAt` | timestamptz | from registry |
| `lastSyncedAt` | timestamptz | updated on every sync touch |
| `deletedAt` | timestamptz | nullable; set when removed from registry |
| `searchVector` | tsvector | **generated column**: `to_tsvector('english', name || ' ' || tagline || ' ' || description || ' ' || array_to_string(tags, ' '))`, GIN-indexed |

### `Favorite`

| column | type | notes |
|---|---|---|
| `userId` | uuid | FK → User, part of composite PK |
| `skillId` | uuid | FK → Skill, part of composite PK, indexed |
| `createdAt` | timestamptz | |

### `InstallLog`

| column | type | notes |
|---|---|---|
| `id` | uuid | PK |
| `userId` | uuid | FK → User, **nullable** (anonymous installs allowed) |
| `skillId` | uuid | FK → Skill, indexed |
| `source` | text | `web` \| `cli` (only `web` in v1) |
| `createdAt` | timestamptz | indexed |

### Indexes

- `skill.searchVector` — GIN
- `skill.tags` — GIN
- `skill.category` — btree
- `skill.featured` — btree (partial: `WHERE featured = true`)
- `skill.deletedAt` — btree (partial: `WHERE deletedAt IS NULL`)
- `install_log(skillId, createdAt DESC)` — for trending
- `favorite(skillId)` — for reverse lookup
- `user.githubId` — unique

### Denormalized counters

`installCount` and `favoriteCount` are kept in sync inside repository methods, in the same transaction as the underlying insert/delete. No triggers. A nightly reconciliation cron is **out of v1 scope**.

---

## 4. Data Flow

### 4a. Registry sync

**Source of truth:** a public GitHub repo `bentoskills/registry`.

```
/skills/
  design-critique/
    skill.yaml
    README.md
  accessibility-review/
    skill.yaml
    README.md
  ...
/registry.json
```

`skill.yaml` schema (validated with Zod):

```yaml
slug: design-critique           # required, [a-z0-9-]+, unique
name: Design Critique           # required
tagline: Get structured...      # required, ≤140 chars
version: 1.2.0                  # required, valid semver
author: alice                   # required, GitHub login
category: critique              # required, enum
tags: [ui, feedback, review]    # optional
license: MIT                    # optional, SPDX id
homepage: https://...           # optional
publishedAt: 2026-03-01         # optional, ISO date
```

**`registry.json`** is a generated index in the registry repo:
```json
[
  { "slug": "design-critique", "path": "skills/design-critique", "sha": "..." },
  ...
]
```

**Sync trigger:** `POST /api/cron/sync-registry`, called by Vercel Cron every 15 minutes, protected by `Authorization: Bearer ${CRON_SECRET}`.

**Sync algorithm** (`lib/registry/sync.ts`):

1. Fetch `registry.json` via Octokit raw content endpoint, with ETag caching.
2. If the registry repo's top-level SHA hasn't changed since `lastSyncedAt` of the most recently synced skill, return `{ skipped: true }`.
3. For each entry in `registry.json`:
   a. Fetch `skill.yaml` and `README.md` via Octokit.
   b. Parse YAML; validate with Zod schema. On failure, append to `errors[]` and continue (do not throw).
   c. Upsert into `skill` by `slug`. Update `lastSyncedAt` to now. Clear `deletedAt` if it was set.
4. Soft-delete: any `skill` whose `slug` is **not** in `registry.json` and whose `deletedAt` is null gets `deletedAt = now()`.
5. Return `{ added, updated, removed, errors }`. Logged via pino; no exception escapes the route handler.

**Idempotency:** the algorithm produces the same DB state for the same registry input. A failed mid-run leaves the DB in a consistent state for the next run to repair.

### 4b. Read path (browse / search / detail)

All read pages are **React Server Components** that call repositories directly. No internal `fetch` to API routes for SSR.

- **`GET /`** — RSC fetches: featured skills, trending (cached 5 min via `unstable_cache`), 12 newest, all categories with counts.
- **`GET /skills`** — RSC reads `?q=`, `?category=`, `?tag=`, `?sort=`, `?page=` from `searchParams`. URL is the source of truth — shareable, back-button friendly.
- **`GET /skills/[slug]`** — RSC fetches one skill by slug, renders README markdown server-side via `remark` → `rehype-sanitize` → `shiki`. 404 on miss or `deletedAt IS NOT NULL`.
- **`GET /api/skills?q=...`** — JSON API for client-side search bar typeahead (debounced 200ms). Same repository as the RSC pages.

**Trending query:**
```sql
SELECT skill_id, COUNT(*) AS hits
FROM install_log
WHERE created_at > now() - interval '7 days'
GROUP BY skill_id
ORDER BY hits DESC
LIMIT 24
```
Cached 5 minutes via `unstable_cache`.

### 4c. Write path (auth + user actions)

- **Sign in:** `/api/auth/signin/github` → NextAuth → GitHub OAuth → callback creates/updates `User` + `Account` + `Session` via TypeORM adapter.
- **Favorite:** client `POST /api/favorites { slug }` → session validated → `FavoriteRepository.favorite(userId, skillId)` inserts row + increments `skill.favoriteCount` in **one transaction**. Returns `{ favorited: true, count }`. Optimistic UI on the client with rollback on failure.
- **Unfavorite:** `DELETE /api/favorites/[slug]` — symmetric.
- **Log install:** client `POST /api/installs { slug }` (fire-and-forget after copy-to-clipboard succeeds) → `InstallLogRepository.log(userId | null, skillId, 'web')` + increment `installCount`. Anonymous users get a `null` userId.

**Validation:** every API route validates its body with Zod. Invalid → 400 + structured field errors. No exceptions.

---

## 5. UI/UX & Design System

The site is a marketplace for designers. The site itself must look design-credible, not generic-shadcn.

### Design language

- **Bento-grid homepage** as the brand signature (self-referential to the name).
- **Light + dark themes** from day one, system-preference default, manual toggle in user menu.
- **Type:** Inter for UI, JetBrains Mono for code/install commands.
- **Color:** neutral zinc base + a single accent: **electric violet `#7C5CFF`**.
- **Density:** generous whitespace, large cards, magazine-feel — not dashboard-dense.
- **Accessibility is the proof point.** Site itself must pass WCAG 2.1 AA. Lighthouse a11y target ≥ 95.

### Components

**shadcn/ui base:** Button, Input, Dialog, Sheet, DropdownMenu, Tabs, Toast, Skeleton, Avatar, Badge, ScrollArea, Tooltip, Accordion.

**Custom:**

- `BentoGrid` — responsive CSS grid with named tile sizes (`sm` 1×1, `md` 2×1, `lg` 2×2, `xl` 3×2 at desktop).
- `SkillCard` — variants: `compact` (browse grid) and `feature` (large bento tile). Shows name, tagline, category chip, tag pills, install count, favorite button.
- `CommandBlock` — terminal-styled box with one-click copy. Used for install commands. Triggers install log on copy.
- `SearchBar` — debounced typeahead via `/api/skills?q=`, keyboard navigation of results, Cmd-K global shortcut.
- `MarkdownView` — server-rendered, sanitized via `rehype-sanitize`, syntax highlighting via `shiki`.
- `CategoryNav`, `TagPill`, `EmptyState`, `Pagination`, `AuthButton`, `FavoriteButton`, `UserMenu`.

### Key screens

1. **`/` Homepage (bento)**
   - `xl` hero tile: tagline + `CommandBlock` (`npx bentoskills install design-critique`)
   - `lg` featured skill tile
   - 4× `md` trending skill tiles
   - Category browser strip (`sm` tiles)
   - "New this week" row
   - Footer with publish-a-skill CTA

2. **`/skills` Browse** — left filter sidebar (category, tags, sort) + responsive grid of `SkillCard compact`. URL is the source of truth for all filter state.

3. **`/skills/[slug]` Detail** — two-column desktop layout:
   - Left: rendered README, screenshots from front-matter if present.
   - Right (sticky): name, tagline, version, author, install `CommandBlock`, manual install accordion, favorite button, tags, "view on GitHub", install count.

4. **`/me` Account** — favorites grid + recent install history list. Designed empty states with friendly CTAs.

5. **`/publish` Docs** — static MDX page documenting the `skill.yaml` schema and the "open a PR to the registry repo" flow.

6. **`/search` Results** — same layout as `/skills`, query echoed prominently, "did you mean" suggestions via Postgres trigram on `skill.name`.

### Interactions

- Cmd-K opens search from anywhere.
- Favoriting is optimistic; failures roll back with a toast.
- Copy-to-clipboard shows a toast and fires the install log in the background.
- Loading states use skeleton cards, never spinners.
- Empty and error states are designed components, not default text.

### Out of scope (visuals)

Custom illustrations (Lucide icons only), animations beyond hover/focus transitions, marketing landing page variants.

---

## 6. Testing, Error Handling, Observability, Security

### Testing

- **Unit (Vitest)** for `lib/registry/parser.ts` and `lib/registry/sync.ts`. Octokit mocked. Coverage: clean sync, no-op when SHA unchanged, soft-delete, malformed entry skipped, idempotency, oversized README, missing fields, bad semver.
- **Repository tests (Vitest + Testcontainers Postgres)** for `SkillRepository.search` (filters, FTS ranking), `FavoriteRepository` (counter consistency in transaction), `InstallLogRepository` (trending query).
- **API route tests (Vitest)** for auth-protected handlers. Session mocked. Validates Zod errors, auth errors, repository call shape.
- **One e2e smoke (Playwright)**: homepage loads, search returns results, skill detail renders, sign-in button visible. Runs against a seeded test DB in CI.
- **No** snapshot tests, **no** component unit tests for shadcn primitives, **no** broad Playwright coverage.

**Coverage target:** 80% on `lib/`. `app/` and `components/` untracked.

### Error handling

- **API routes**: every handler wrapped in `withErrorHandler`. Maps `ValidationError` → 400, `NotFoundError` → 404, `UnauthorizedError` → 401, anything else → 500 + logged. Response shape: `{ error: { code, message, fields? } }`.
- **RSC pages**: errors bubble to nearest `error.tsx`. Per-route boundaries for `/skills/[slug]` and `/me`.
- **Registry sync**: per-skill errors collected in `errors[]`, never thrown. One bad skill never breaks a sync run.
- **Client mutations**: optimistic with rollback + toast on failure.

### Observability

- **pino** structured logging. One logger per module. JSON output, Vercel parses it.
- **Vercel Analytics** for page views.
- **Sync health**: `/api/cron/sync-registry` response logged with `{ added, updated, removed, errors }`.
- **Sentry**: out of v1 scope.
- **`/admin/sync-status` page**: out of v1 scope.

### Security

- All secrets in env. `.env*` gitignored from commit 1.
- Security headers via `next.config.ts`: CSP, X-Frame-Options, Referrer-Policy, X-Content-Type-Options.
- CSRF: NextAuth handles its own. Mutation API routes are session-cookie-protected and same-origin only.
- Rate limiting on `/api/installs` and `/api/favorites`. Use `@upstash/ratelimit` if Upstash is configured; otherwise an in-memory limiter (acceptable at v1 traffic, documented as a known limitation).
- Markdown sanitization: `rehype-sanitize` on all rendered READMEs. No raw HTML from registry content.
- Cron route requires `Authorization: Bearer ${CRON_SECRET}`.
- Supabase Postgres connections use SSL (`ssl: { rejectUnauthorized: false }`).

### CI

GitHub Actions: `pnpm install` → `pnpm typecheck` → `pnpm lint` → `pnpm test` → `pnpm build`. Postgres service container for repository tests.

---

## 7. Environment

`.env.local` (gitignored):

```
DATABASE_URL=postgresql://postgres:PASSWORD@db.<project>.supabase.co:5432/postgres
DATABASE_SSL=true

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<openssl rand -base64 32>

GITHUB_ID=<oauth app client id>
GITHUB_SECRET=<oauth app client secret>

GITHUB_REGISTRY_REPO=bentoskills/registry
GITHUB_TOKEN=<read-only PAT for higher rate limits>

CRON_SECRET=<random>

UPSTASH_REDIS_REST_URL=        # optional
UPSTASH_REDIS_REST_TOKEN=      # optional
```

---

## 8. Out of scope for v1 (phase 2 candidates)

- Real CLI published to npm (`npx bentoskills install <slug>`)
- Ratings, reviews, comments
- User-curated collections
- Creator dashboard, in-product publishing
- `/admin/sync-status` page
- Sentry integration
- Nightly counter reconciliation cron
- Email notifications
- Private skills, organizations, payments
