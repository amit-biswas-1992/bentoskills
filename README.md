# bentoskills.sh

> A marketplace for UI/UX Claude Code agent skills — browse, install, and share curated design skills.

[![CI](https://github.com/amit-biswas-1992/bentoskills/actions/workflows/ci.yml/badge.svg)](https://github.com/amit-biswas-1992/bentoskills/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-7C5CFF.svg)](LICENSE)

## What is BentoSkills?

BentoSkills is a consumer-focused marketplace for Claude Code agent skills that enhance UI/UX workflows. Think of it as an app store for design-oriented AI skills.

**Built-in skill categories:**
- **Design Critique** — Get actionable feedback on your UI designs
- **Accessibility Review** — Audit components for WCAG compliance
- **UX Copy** — Generate and refine microcopy
- **Design Handoff** — Bridge the gap between design and code
- **User Research** — Structure and analyze user research
- **Design System** — Build and maintain design systems

## Features

- **Browse & Search** — Full-text search with category filtering, trending, and featured skills
- **One-Click Install** — Copy a single command to install any skill
- **GitHub OAuth** — Sign in to favorite skills and track installs
- **Bento Grid Layout** — Beautiful, responsive UI with electric violet accent
- **GitHub-Backed Registry** — Skills are synced from a GitHub registry repo into Postgres

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, RSC) |
| Language | TypeScript (strict) |
| Database | PostgreSQL (Supabase) + TypeORM |
| Auth | NextAuth v5 (Auth.js) + GitHub |
| Search | Postgres tsvector + GIN index |
| Styling | Tailwind CSS v4 + CVA |
| Testing | Vitest + Playwright |
| CI/CD | GitHub Actions + Vercel |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 16 (or a Supabase project)
- GitHub OAuth App ([create one here](https://github.com/settings/developers))

### Setup

```bash
# Clone the repo
git clone https://github.com/amit-biswas-1992/bentoskills.git
cd bentoskills

# Install dependencies
pnpm install

# Copy env template and fill in your values
cp .env.local.example .env.local

# Run database migration
pnpm db:migrate

# Seed with starter skills
pnpm db:seed

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

See [`.env.local.example`](.env.local.example) for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string |
| `DATABASE_SSL` | Set to `true` for Supabase |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `GITHUB_ID` / `GITHUB_SECRET` | OAuth app credentials |
| `GITHUB_REGISTRY_REPO` | `owner/repo` for the skill registry |
| `CRON_SECRET` | Protects the sync cron endpoint |

## Project Structure

```
app/
  (marketing)/          # Public pages (home, browse, skill detail, publish)
  (app)/                # Auth-gated pages (account, favorites)
  api/                  # API routes (skills, favorites, installs, cron)
components/
  ui/                   # Primitives (Button, Input, Badge, Skeleton)
  skill-card.tsx        # Compact + featured skill cards
  bento-grid.tsx        # Responsive bento grid layout
  command-block.tsx     # One-click install with clipboard
  favorite-button.tsx   # Optimistic favorite toggle
lib/
  db/                   # TypeORM DataSource, entities, repositories
  registry/             # GitHub client, YAML parser, sync algorithm
  auth/                 # NextAuth configuration
  api/                  # Error handling utilities
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:e2e` | Run E2E tests (Playwright) |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | ESLint |
| `pnpm db:migrate` | Run TypeORM migrations |
| `pnpm db:revert` | Revert last migration |
| `pnpm db:seed` | Seed database with starter skills |

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

[MIT](LICENSE) — built with care by [Amit Biswas](https://github.com/amit-biswas-1992).
