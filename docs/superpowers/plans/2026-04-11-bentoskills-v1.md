# bentoskills.sh v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the v1 consumer experience of bentoskills.sh — a browsable, searchable marketplace of UI/UX agent skills with GitHub auth, favorites, install logging, and a GitHub-backed registry sync.

**Architecture:** Single Next.js 15 (App Router) app with TypeORM + Postgres (Supabase). Registry lives as a separate public GitHub repo; a cron-triggered sync reads it via Octokit and upserts into Postgres. Auth via NextAuth GitHub provider. Full-text search via Postgres `tsvector`. UI built on Tailwind v4 + shadcn/ui with a custom electric-violet accent and bento-grid homepage.

**Tech Stack:** Next.js 15, TypeScript (strict), TypeORM, PostgreSQL 16, NextAuth v5, Tailwind CSS v4, shadcn/ui, Zod, Octokit, remark/rehype, shiki, pino, Vitest, Testcontainers, Playwright, pnpm.

**Reference:** Design spec at `docs/superpowers/specs/2026-04-11-bentoskills-design.md`.

---

## Phase 0 — Project Foundation

### Task 1: Initialize the repo and scaffold Next.js

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `.env.local.example`, `README.md`

- [ ] **Step 1: Init git and scaffold Next.js**

```bash
cd "/Users/hello/Work/My Work/ABRLab/github-opensource-byme"
git init
pnpm create next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*" --eslint --use-pnpm --no-turbopack
```

Accept all defaults. When asked to overwrite existing files, accept.

- [ ] **Step 2: Create `.gitignore` additions**

Append to `.gitignore`:
```
# env
.env
.env.local
.env.*.local

# db
*.sqlite

# testing
coverage/
playwright-report/
test-results/
```

- [ ] **Step 3: Create `.env.local.example`**

```
DATABASE_URL=postgresql://postgres:PASSWORD@db.<project>.supabase.co:5432/postgres
DATABASE_SSL=true

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

GITHUB_ID=
GITHUB_SECRET=

GITHUB_REGISTRY_REPO=bentoskills/registry
GITHUB_TOKEN=

CRON_SECRET=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

- [ ] **Step 4: Replace `README.md`**

```markdown
# bentoskills.sh

A marketplace for UI/UX Claude Code agent skills.

## Development

```bash
pnpm install
cp .env.local.example .env.local   # fill in values
pnpm db:migrate
pnpm dev
```

See `docs/superpowers/specs/2026-04-11-bentoskills-design.md` for the full design.
```

- [ ] **Step 5: Enable TypeScript strict + path alias for lib**

Edit `tsconfig.json` `compilerOptions`:
```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "forceConsistentCasingInFileNames": true,
  "paths": {
    "@/*": ["./*"]
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 app with TypeScript strict"
```

---

### Task 2: Install runtime and dev dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime deps**

```bash
pnpm add typeorm reflect-metadata pg @auth/typeorm-adapter next-auth@beta zod octokit gray-matter remark rehype rehype-sanitize rehype-stringify remark-parse remark-rehype shiki pino clsx class-variance-authority tailwind-merge lucide-react
```

- [ ] **Step 2: Install dev deps**

```bash
pnpm add -D vitest @vitest/coverage-v8 @testcontainers/postgresql testcontainers @playwright/test @types/pg dotenv tsx
```

- [ ] **Step 3: Add scripts to `package.json`**

Replace the `scripts` block:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "db:generate": "tsx lib/db/cli.ts generate",
  "db:migrate": "tsx lib/db/cli.ts migrate",
  "db:revert": "tsx lib/db/cli.ts revert"
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: install runtime and dev dependencies"
```

---

### Task 3: Configure Vitest

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: ["lib/db/migrations/**", "lib/db/cli.ts"],
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 2: Create `vitest.setup.ts`**

```ts
import "reflect-metadata";
```

- [ ] **Step 3: Verify Vitest runs**

```bash
pnpm test
```

Expected: `No test files found` (non-zero but framework works). That's fine.

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts vitest.setup.ts
git commit -m "chore: configure Vitest with coverage thresholds"
```

---

## Phase 1 — Database Layer

### Task 4: Create the TypeORM DataSource singleton

**Files:**
- Create: `lib/db/data-source.ts`, `lib/db/entities/index.ts`, `lib/db/cli.ts`

- [ ] **Step 1: Create `lib/db/data-source.ts`**

```ts
import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "node:path";

const globalForDb = globalThis as unknown as { _dataSource?: DataSource };

export function getDataSource(): DataSource {
  if (globalForDb._dataSource) return globalForDb._dataSource;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const ds = new DataSource({
    type: "postgres",
    url,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
    entities: [path.join(process.cwd(), "lib/db/entities/*.ts")],
    migrations: [path.join(process.cwd(), "lib/db/migrations/*.ts")],
    synchronize: false,
    logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  globalForDb._dataSource = ds;
  return ds;
}

export async function ensureInitialized(): Promise<DataSource> {
  const ds = getDataSource();
  if (!ds.isInitialized) await ds.initialize();
  return ds;
}
```

- [ ] **Step 2: Create `lib/db/entities/index.ts`**

```ts
// Re-exports entities for DataSource; populated as entities are added.
export {};
```

- [ ] **Step 3: Create `lib/db/cli.ts`**

```ts
import "reflect-metadata";
import { config } from "dotenv";
import { getDataSource } from "./data-source";

config({ path: ".env.local" });

async function main() {
  const cmd = process.argv[2];
  const ds = getDataSource();
  await ds.initialize();

  switch (cmd) {
    case "migrate":
      await ds.runMigrations();
      console.log("migrations applied");
      break;
    case "revert":
      await ds.undoLastMigration();
      console.log("last migration reverted");
      break;
    case "generate": {
      const name = process.argv[3];
      if (!name) throw new Error("usage: pnpm db:generate <Name>");
      console.log(`run: pnpm typeorm migration:generate lib/db/migrations/${name} -d lib/db/data-source.ts`);
      break;
    }
    default:
      throw new Error(`unknown command: ${cmd}`);
  }
  await ds.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 4: Commit**

```bash
git add lib/db
git commit -m "feat(db): add TypeORM DataSource singleton and CLI"
```

---

### Task 5: Define the `BaseEntity` mixin

**Files:**
- Create: `lib/db/entities/base.entity.ts`

- [ ] **Step 1: Create `lib/db/entities/base.entity.ts`**

```ts
import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

export abstract class Base {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/db/entities/base.entity.ts
git commit -m "feat(db): add Base entity mixin"
```

---

### Task 6: Define the `User`, `Account`, `Session` entities

**Files:**
- Create: `lib/db/entities/user.entity.ts`, `lib/db/entities/account.entity.ts`, `lib/db/entities/session.entity.ts`
- Modify: `lib/db/entities/index.ts`

- [ ] **Step 1: Create `lib/db/entities/user.entity.ts`**

```ts
import { Column, Entity, Index, OneToMany } from "typeorm";
import { Base } from "./base.entity";

@Entity("user")
export class User extends Base {
  @Index({ unique: true })
  @Column({ type: "bigint" })
  githubId!: string;

  @Index({ unique: true })
  @Column({ type: "text" })
  username!: string;

  @Column({ type: "text", nullable: true })
  name!: string | null;

  @Column({ type: "text", nullable: true })
  avatarUrl!: string | null;

  @Column({ type: "text", nullable: true })
  email!: string | null;
}
```

- [ ] **Step 2: Create `lib/db/entities/account.entity.ts`**

```ts
import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("account")
@Index(["provider", "providerAccountId"], { unique: true })
export class Account {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "text" })
  type!: string;

  @Column({ type: "text" })
  provider!: string;

  @Column({ type: "text" })
  providerAccountId!: string;

  @Column({ type: "text", nullable: true })
  refresh_token!: string | null;

  @Column({ type: "text", nullable: true })
  access_token!: string | null;

  @Column({ type: "bigint", nullable: true })
  expires_at!: string | null;

  @Column({ type: "text", nullable: true })
  token_type!: string | null;

  @Column({ type: "text", nullable: true })
  scope!: string | null;

  @Column({ type: "text", nullable: true })
  id_token!: string | null;

  @Column({ type: "text", nullable: true })
  session_state!: string | null;
}
```

- [ ] **Step 3: Create `lib/db/entities/session.entity.ts`**

```ts
import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("session")
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "text" })
  sessionToken!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "timestamptz" })
  expires!: Date;
}
```

- [ ] **Step 4: Update `lib/db/entities/index.ts`**

```ts
export { User } from "./user.entity";
export { Account } from "./account.entity";
export { Session } from "./session.entity";
```

- [ ] **Step 5: Commit**

```bash
git add lib/db/entities
git commit -m "feat(db): add User, Account, Session entities"
```

---

### Task 7: Define the `Skill` entity

**Files:**
- Create: `lib/db/entities/skill.entity.ts`
- Modify: `lib/db/entities/index.ts`

- [ ] **Step 1: Create `lib/db/entities/skill.entity.ts`**

```ts
import { Column, Entity, Index } from "typeorm";
import { Base } from "./base.entity";

export type SkillCategory =
  | "accessibility"
  | "critique"
  | "copy"
  | "handoff"
  | "research"
  | "system";

@Entity("skill")
@Index("idx_skill_featured", ["featured"], { where: `"featured" = true` })
@Index("idx_skill_deleted", ["deletedAt"], { where: `"deletedAt" IS NULL` })
export class Skill extends Base {
  @Index({ unique: true })
  @Column({ type: "text" })
  slug!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text" })
  tagline!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "text" })
  version!: string;

  @Column({ type: "text" })
  author!: string;

  @Column({ type: "text" })
  repoUrl!: string;

  @Column({ type: "text", nullable: true })
  homepageUrl!: string | null;

  @Column({ type: "text", nullable: true })
  licenseSpdx!: string | null;

  @Index()
  @Column({ type: "text" })
  category!: SkillCategory;

  @Column({ type: "text", array: true, default: () => "'{}'" })
  tags!: string[];

  @Column({ type: "int", default: 0 })
  installCount!: number;

  @Column({ type: "int", default: 0 })
  favoriteCount!: number;

  @Column({ type: "boolean", default: false })
  featured!: boolean;

  @Column({ type: "timestamptz", nullable: true })
  publishedAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  lastSyncedAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  deletedAt!: Date | null;
}
```

Note: the `searchVector` generated column and its GIN index are added via raw SQL in the first migration (Task 9). TypeORM's support for generated `tsvector` columns is limited, so we manage it in migration SQL.

- [ ] **Step 2: Update `lib/db/entities/index.ts`**

```ts
export { User } from "./user.entity";
export { Account } from "./account.entity";
export { Session } from "./session.entity";
export { Skill, type SkillCategory } from "./skill.entity";
```

- [ ] **Step 3: Commit**

```bash
git add lib/db/entities
git commit -m "feat(db): add Skill entity"
```

---

### Task 8: Define `Favorite` and `InstallLog` entities

**Files:**
- Create: `lib/db/entities/favorite.entity.ts`, `lib/db/entities/install-log.entity.ts`
- Modify: `lib/db/entities/index.ts`

- [ ] **Step 1: Create `lib/db/entities/favorite.entity.ts`**

```ts
import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("favorite")
export class Favorite {
  @PrimaryColumn({ type: "uuid" })
  userId!: string;

  @Index()
  @PrimaryColumn({ type: "uuid" })
  skillId!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
```

- [ ] **Step 2: Create `lib/db/entities/install-log.entity.ts`**

```ts
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

export type InstallSource = "web" | "cli";

@Entity("install_log")
@Index("idx_install_skill_created", ["skillId", "createdAt"])
export class InstallLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", nullable: true })
  userId!: string | null;

  @Column({ type: "uuid" })
  skillId!: string;

  @Column({ type: "text" })
  source!: InstallSource;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
```

- [ ] **Step 3: Update `lib/db/entities/index.ts`**

```ts
export { User } from "./user.entity";
export { Account } from "./account.entity";
export { Session } from "./session.entity";
export { Skill, type SkillCategory } from "./skill.entity";
export { Favorite } from "./favorite.entity";
export { InstallLog, type InstallSource } from "./install-log.entity";
```

- [ ] **Step 4: Commit**

```bash
git add lib/db/entities
git commit -m "feat(db): add Favorite and InstallLog entities"
```

---

### Task 9: Create the initial migration

**Files:**
- Create: `lib/db/migrations/1712800000000-Initial.ts`

- [ ] **Step 1: Generate base migration (auto)**

```bash
pnpm exec typeorm migration:generate lib/db/migrations/Initial -d lib/db/data-source.ts
```

If generation fails because the DB isn't reachable, create the file manually with the content below.

- [ ] **Step 2: Append `searchVector` generated column + GIN index**

Open the generated migration and append inside `up()`:

```ts
await queryRunner.query(`
  ALTER TABLE "skill"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce("name",'') || ' ' ||
      coalesce("tagline",'') || ' ' ||
      coalesce("description",'') || ' ' ||
      coalesce(array_to_string("tags",' '),'')
    )
  ) STORED;
`);
await queryRunner.query(`CREATE INDEX "idx_skill_search" ON "skill" USING GIN ("searchVector");`);
await queryRunner.query(`CREATE INDEX "idx_skill_tags" ON "skill" USING GIN ("tags");`);
```

And in `down()`:
```ts
await queryRunner.query(`DROP INDEX IF EXISTS "idx_skill_tags";`);
await queryRunner.query(`DROP INDEX IF EXISTS "idx_skill_search";`);
await queryRunner.query(`ALTER TABLE "skill" DROP COLUMN IF EXISTS "searchVector";`);
```

- [ ] **Step 3: Run the migration against Supabase**

```bash
pnpm db:migrate
```

Expected: `migrations applied`.

- [ ] **Step 4: Verify tables exist**

```bash
pnpm exec tsx -e 'import "dotenv/config"; import { ensureInitialized } from "./lib/db/data-source"; (async () => { const ds = await ensureInitialized(); const rows = await ds.query("SELECT tablename FROM pg_tables WHERE schemaname=\"public\" ORDER BY 1"); console.log(rows); await ds.destroy(); })()'
```

Expected: array containing `user`, `account`, `session`, `skill`, `favorite`, `install_log`, `migrations`.

- [ ] **Step 5: Commit**

```bash
git add lib/db/migrations
git commit -m "feat(db): initial migration with tsvector search column"
```

---

## Phase 2 — Registry Sync (pure, testable)

### Task 10: Write the `skill.yaml` Zod schema + parser (TDD)

**Files:**
- Create: `lib/registry/parser.ts`, `lib/registry/parser.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// lib/registry/parser.test.ts
import { describe, it, expect } from "vitest";
import { parseSkillYaml, ParsedSkillSchema } from "./parser";

const valid = `
slug: design-critique
name: Design Critique
tagline: Get structured design feedback on usability
version: 1.2.0
author: alice
category: critique
tags: [ui, feedback]
license: MIT
`;

describe("parseSkillYaml", () => {
  it("parses a valid skill.yaml", () => {
    const res = parseSkillYaml(valid);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.slug).toBe("design-critique");
      expect(res.data.tags).toEqual(["ui", "feedback"]);
    }
  });

  it("rejects missing required fields", () => {
    const res = parseSkillYaml("slug: foo");
    expect(res.ok).toBe(false);
  });

  it("rejects bad semver", () => {
    const res = parseSkillYaml(valid.replace("1.2.0", "not-semver"));
    expect(res.ok).toBe(false);
  });

  it("rejects tagline >140 chars", () => {
    const long = valid.replace("Get structured design feedback on usability", "x".repeat(141));
    const res = parseSkillYaml(long);
    expect(res.ok).toBe(false);
  });

  it("rejects bad category", () => {
    const res = parseSkillYaml(valid.replace("critique", "marketing"));
    expect(res.ok).toBe(false);
  });

  it("rejects slug with uppercase", () => {
    const res = parseSkillYaml(valid.replace("design-critique", "Design-Critique"));
    expect(res.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
pnpm test lib/registry/parser.test.ts
```

Expected: all tests fail (module not found).

- [ ] **Step 3: Implement `lib/registry/parser.ts`**

```ts
import { z } from "zod";
import { parse as parseYaml } from "yaml";

const SEMVER = /^\d+\.\d+\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?$/;
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

export const ParsedSkillSchema = z.object({
  slug: z.string().regex(SLUG),
  name: z.string().min(1).max(80),
  tagline: z.string().min(1).max(140),
  version: z.string().regex(SEMVER),
  author: z.string().min(1).max(80),
  category: z.enum(["accessibility", "critique", "copy", "handoff", "research", "system"]),
  tags: z.array(z.string().min(1).max(30)).max(20).default([]),
  license: z.string().optional(),
  homepage: z.string().url().optional(),
  publishedAt: z.coerce.date().optional(),
});

export type ParsedSkill = z.infer<typeof ParsedSkillSchema>;

export type ParseResult =
  | { ok: true; data: ParsedSkill }
  | { ok: false; error: string };

export function parseSkillYaml(raw: string): ParseResult {
  let obj: unknown;
  try {
    obj = parseYaml(raw);
  } catch (e) {
    return { ok: false, error: `yaml parse error: ${(e as Error).message}` };
  }
  const res = ParsedSkillSchema.safeParse(obj);
  if (!res.success) return { ok: false, error: res.error.message };
  return { ok: true, data: res.data };
}
```

- [ ] **Step 4: Install `yaml` package**

```bash
pnpm add yaml
```

- [ ] **Step 5: Run — verify pass**

```bash
pnpm test lib/registry/parser.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/registry pnpm-lock.yaml package.json
git commit -m "feat(registry): add skill.yaml parser with Zod schema"
```

---

### Task 11: Build the GitHub client wrapper

**Files:**
- Create: `lib/registry/github.ts`

- [ ] **Step 1: Create `lib/registry/github.ts`**

```ts
import { Octokit } from "octokit";

export interface RegistryEntry {
  slug: string;
  path: string;
  sha: string;
}

export interface GithubClient {
  fetchRegistryIndex(): Promise<{ entries: RegistryEntry[]; repoSha: string }>;
  fetchSkillFile(path: string, file: "skill.yaml" | "README.md"): Promise<string>;
}

export function createGithubClient(repo: string, token?: string): GithubClient {
  const [owner, name] = repo.split("/");
  if (!owner || !name) throw new Error(`invalid GITHUB_REGISTRY_REPO: ${repo}`);
  const octokit = new Octokit({ auth: token });

  return {
    async fetchRegistryIndex() {
      const repoInfo = await octokit.rest.repos.get({ owner, repo: name });
      const repoSha = repoInfo.data.default_branch; // placeholder; real sha below
      const commit = await octokit.rest.repos.getCommit({ owner, repo: name, ref: repoInfo.data.default_branch });
      const indexRaw = await octokit.rest.repos.getContent({
        owner,
        repo: name,
        path: "registry.json",
        mediaType: { format: "raw" },
      });
      const entries = JSON.parse(indexRaw.data as unknown as string) as RegistryEntry[];
      return { entries, repoSha: commit.data.sha };
    },

    async fetchSkillFile(path, file) {
      const res = await octokit.rest.repos.getContent({
        owner,
        repo: name,
        path: `${path}/${file}`,
        mediaType: { format: "raw" },
      });
      return res.data as unknown as string;
    },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/registry/github.ts
git commit -m "feat(registry): add Octokit-based GitHub client"
```

---

### Task 12: Define the `SkillRepository` (write side)

**Files:**
- Create: `lib/db/repositories/skill.repository.ts`

- [ ] **Step 1: Create `lib/db/repositories/skill.repository.ts`**

```ts
import { In, IsNull, Not } from "typeorm";
import { ensureInitialized } from "../data-source";
import { Skill, type SkillCategory } from "../entities";

export interface SkillUpsertInput {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  version: string;
  author: string;
  repoUrl: string;
  homepageUrl: string | null;
  licenseSpdx: string | null;
  category: SkillCategory;
  tags: string[];
  publishedAt: Date | null;
}

export class SkillRepository {
  async upsertFromRegistry(input: SkillUpsertInput): Promise<"added" | "updated"> {
    const ds = await ensureInitialized();
    const repo = ds.getRepository(Skill);
    const existing = await repo.findOne({ where: { slug: input.slug } });
    if (existing) {
      Object.assign(existing, input, { deletedAt: null, lastSyncedAt: new Date() });
      await repo.save(existing);
      return "updated";
    }
    const created = repo.create({ ...input, lastSyncedAt: new Date() });
    await repo.save(created);
    return "added";
  }

  async softDeleteMissing(presentSlugs: string[]): Promise<number> {
    const ds = await ensureInitialized();
    const repo = ds.getRepository(Skill);
    const res = await repo
      .createQueryBuilder()
      .update(Skill)
      .set({ deletedAt: () => "now()" })
      .where({ slug: Not(In(presentSlugs)), deletedAt: IsNull() })
      .execute();
    return res.affected ?? 0;
  }

  async findLatestSync(): Promise<Date | null> {
    const ds = await ensureInitialized();
    const repo = ds.getRepository(Skill);
    const row = await repo.findOne({ where: {}, order: { lastSyncedAt: "DESC" } });
    return row?.lastSyncedAt ?? null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/db/repositories
git commit -m "feat(db): add SkillRepository with upsert and soft-delete"
```

---

### Task 13: Write `lib/registry/sync.ts` with unit tests (TDD)

**Files:**
- Create: `lib/registry/sync.ts`, `lib/registry/sync.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// lib/registry/sync.test.ts
import { describe, it, expect, vi } from "vitest";
import { syncRegistry, type SyncDeps } from "./sync";

function makeDeps(overrides: Partial<SyncDeps> = {}): SyncDeps {
  return {
    github: {
      fetchRegistryIndex: vi.fn(async () => ({
        entries: [{ slug: "a", path: "skills/a", sha: "abc" }],
        repoSha: "repo-1",
      })),
      fetchSkillFile: vi.fn(async (_p, file) =>
        file === "skill.yaml"
          ? "slug: a\nname: A\ntagline: t\nversion: 1.0.0\nauthor: x\ncategory: critique\n"
          : "# readme",
      ),
    },
    repo: {
      upsertFromRegistry: vi.fn(async () => "added" as const),
      softDeleteMissing: vi.fn(async () => 0),
      findLatestSync: vi.fn(async () => null),
    },
    repoUrlFor: (slug) => `https://github.com/r/registry/tree/main/skills/${slug}`,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    ...overrides,
  };
}

describe("syncRegistry", () => {
  it("adds a new skill end-to-end", async () => {
    const deps = makeDeps();
    const res = await syncRegistry(deps);
    expect(res.added).toBe(1);
    expect(res.errors).toHaveLength(0);
    expect(deps.repo.upsertFromRegistry).toHaveBeenCalledOnce();
  });

  it("soft-deletes slugs no longer in the registry", async () => {
    const deps = makeDeps({
      repo: {
        upsertFromRegistry: vi.fn(async () => "updated" as const),
        softDeleteMissing: vi.fn(async () => 2),
        findLatestSync: vi.fn(async () => null),
      },
    });
    const res = await syncRegistry(deps);
    expect(res.removed).toBe(2);
    expect(deps.repo.softDeleteMissing).toHaveBeenCalledWith(["a"]);
  });

  it("collects per-skill errors without throwing", async () => {
    const deps = makeDeps({
      github: {
        fetchRegistryIndex: vi.fn(async () => ({
          entries: [
            { slug: "a", path: "skills/a", sha: "x" },
            { slug: "b", path: "skills/b", sha: "y" },
          ],
          repoSha: "s",
        })),
        fetchSkillFile: vi.fn(async (path, file) => {
          if (path === "skills/b" && file === "skill.yaml") return "not: valid\n";
          return file === "skill.yaml"
            ? "slug: a\nname: A\ntagline: t\nversion: 1.0.0\nauthor: x\ncategory: critique\n"
            : "# readme";
        }),
      },
    });
    const res = await syncRegistry(deps);
    expect(res.added + res.updated).toBe(1);
    expect(res.errors.length).toBe(1);
    expect(res.errors[0]?.slug).toBe("b");
  });

  it("is idempotent: second run with same input does not throw", async () => {
    const deps = makeDeps();
    await syncRegistry(deps);
    const res = await syncRegistry(deps);
    expect(res.errors).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
pnpm test lib/registry/sync.test.ts
```

Expected: module not found.

- [ ] **Step 3: Implement `lib/registry/sync.ts`**

```ts
import type { GithubClient } from "./github";
import { parseSkillYaml } from "./parser";
import type { SkillRepository } from "../db/repositories/skill.repository";

export interface SyncDeps {
  github: GithubClient;
  repo: SkillRepository;
  repoUrlFor: (slug: string) => string;
  logger: { info: (m: string, ctx?: unknown) => void; warn: (m: string, ctx?: unknown) => void; error: (m: string, ctx?: unknown) => void };
}

export interface SyncResult {
  added: number;
  updated: number;
  removed: number;
  errors: { slug: string; error: string }[];
}

export async function syncRegistry(deps: SyncDeps): Promise<SyncResult> {
  const { github, repo, repoUrlFor, logger } = deps;
  const result: SyncResult = { added: 0, updated: 0, removed: 0, errors: [] };

  const { entries } = await github.fetchRegistryIndex();
  const presentSlugs: string[] = [];

  for (const entry of entries) {
    try {
      const [yamlRaw, readme] = await Promise.all([
        github.fetchSkillFile(entry.path, "skill.yaml"),
        github.fetchSkillFile(entry.path, "README.md"),
      ]);
      const parsed = parseSkillYaml(yamlRaw);
      if (!parsed.ok) {
        result.errors.push({ slug: entry.slug, error: parsed.error });
        logger.warn("skill parse failed", { slug: entry.slug, error: parsed.error });
        continue;
      }
      const data = parsed.data;
      const action = await repo.upsertFromRegistry({
        slug: data.slug,
        name: data.name,
        tagline: data.tagline,
        description: readme,
        version: data.version,
        author: data.author,
        repoUrl: repoUrlFor(data.slug),
        homepageUrl: data.homepage ?? null,
        licenseSpdx: data.license ?? null,
        category: data.category,
        tags: data.tags,
        publishedAt: data.publishedAt ?? null,
      });
      if (action === "added") result.added += 1;
      else result.updated += 1;
      presentSlugs.push(data.slug);
    } catch (e) {
      result.errors.push({ slug: entry.slug, error: (e as Error).message });
      logger.error("skill fetch failed", { slug: entry.slug, error: (e as Error).message });
    }
  }

  result.removed = await repo.softDeleteMissing(presentSlugs);
  logger.info("registry sync complete", result);
  return result;
}
```

- [ ] **Step 4: Run — verify pass**

```bash
pnpm test lib/registry/sync.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/registry/sync.ts lib/registry/sync.test.ts
git commit -m "feat(registry): sync algorithm with per-skill error isolation"
```

---

### Task 14: Wire up the cron route

**Files:**
- Create: `app/api/cron/sync-registry/route.ts`, `lib/logger.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Create `lib/logger.ts`**

```ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "bentoskills" },
});
```

- [ ] **Step 2: Create `app/api/cron/sync-registry/route.ts`**

```ts
import { NextResponse } from "next/server";
import { syncRegistry } from "@/lib/registry/sync";
import { createGithubClient } from "@/lib/registry/github";
import { SkillRepository } from "@/lib/db/repositories/skill.repository";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const repoName = process.env.GITHUB_REGISTRY_REPO;
  if (!repoName) return NextResponse.json({ error: "GITHUB_REGISTRY_REPO not set" }, { status: 500 });

  const github = createGithubClient(repoName, process.env.GITHUB_TOKEN);
  const repo = new SkillRepository();
  const result = await syncRegistry({
    github,
    repo,
    repoUrlFor: (slug) => `https://github.com/${repoName}/tree/main/skills/${slug}`,
    logger,
  });

  return NextResponse.json(result);
}
```

- [ ] **Step 3: Create `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-registry",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Note: Vercel Cron calls `GET`. Add a GET handler that rejects if not authorized; for now keep POST only and configure the cron to use a signed header via Vercel Cron's `x-vercel-cron` + our secret. Simpler: add a GET that also checks the header.

Append to `route.ts`:
```ts
export async function GET(req: Request) {
  return POST(req);
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/logger.ts app/api/cron vercel.json
git commit -m "feat(api): cron route for registry sync"
```

---

## Phase 3 — Auth & API Error Plumbing

### Task 15: Wire up NextAuth with GitHub provider

**Files:**
- Create: `lib/auth/options.ts`, `lib/auth/server.ts`, `app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create `lib/auth/options.ts`**

```ts
import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import { TypeORMAdapter } from "@auth/typeorm-adapter";

export const authOptions: NextAuthConfig = {
  adapter: TypeORMAdapter(process.env.DATABASE_URL!, {
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  }),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  session: { strategy: "database" },
  callbacks: {
    async session({ session, user }) {
      if (session.user) (session.user as { id?: string }).id = user.id;
      return session;
    },
  },
};
```

- [ ] **Step 2: Create `lib/auth/server.ts`**

```ts
import NextAuth from "next-auth";
import { authOptions } from "./options";

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
```

- [ ] **Step 3: Create `app/api/auth/[...nextauth]/route.ts`**

```ts
export { GET, POST } from "@/lib/auth/server";
```

Wait — `handlers` is the export. Replace with:
```ts
import { handlers } from "@/lib/auth/server";
export const { GET, POST } = handlers;
```

- [ ] **Step 4: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/auth app/api/auth
git commit -m "feat(auth): wire up NextAuth with GitHub provider and TypeORM adapter"
```

---

### Task 16: Add API error handler + error types

**Files:**
- Create: `lib/api/errors.ts`, `lib/api/handler.ts`

- [ ] **Step 1: Create `lib/api/errors.ts`**

```ts
export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string[]>) {
    super(message);
  }
}

export const NotFound = (msg = "not found") => new HttpError(404, "not_found", msg);
export const Unauthorized = (msg = "unauthorized") => new HttpError(401, "unauthorized", msg);
export const BadRequest = (msg: string, fields?: Record<string, string[]>) =>
  new HttpError(400, "bad_request", msg, fields);
```

- [ ] **Step 2: Create `lib/api/handler.ts`**

```ts
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./errors";
import { logger } from "@/lib/logger";

export function withErrorHandler<T extends (req: Request, ctx: any) => Promise<Response>>(fn: T): T {
  return (async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json(
          { error: { code: e.code, message: e.message, fields: e.fields } },
          { status: e.status },
        );
      }
      if (e instanceof ZodError) {
        const fields: Record<string, string[]> = {};
        for (const iss of e.issues) {
          const key = iss.path.join(".") || "_";
          (fields[key] ||= []).push(iss.message);
        }
        return NextResponse.json(
          { error: { code: "validation_error", message: "invalid input", fields } },
          { status: 400 },
        );
      }
      logger.error("unhandled api error", { error: (e as Error).message });
      return NextResponse.json(
        { error: { code: "internal_error", message: "something went wrong" } },
        { status: 500 },
      );
    }
  }) as T;
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/api
git commit -m "feat(api): add HttpError types and withErrorHandler wrapper"
```

---

## Phase 4 — Read Path (Search, Browse, Detail)

### Task 17: Add `SkillRepository.search` and read helpers (TDD)

**Files:**
- Modify: `lib/db/repositories/skill.repository.ts`
- Create: `lib/db/repositories/skill.repository.test.ts`

- [ ] **Step 1: Write failing test (Testcontainers)**

```ts
// lib/db/repositories/skill.repository.test.ts
import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { DataSource } from "typeorm";
import * as entities from "../entities";
import { SkillRepository } from "./skill.repository";

let container: StartedPostgreSqlContainer;
let ds: DataSource;
let repo: SkillRepository;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16").start();
  process.env.DATABASE_URL = container.getConnectionUri();
  ds = new DataSource({
    type: "postgres",
    url: container.getConnectionUri(),
    entities: Object.values(entities),
    synchronize: true,
  });
  await ds.initialize();
  // add the tsvector column that migrations would normally create
  await ds.query(`
    ALTER TABLE "skill" ADD COLUMN "searchVector" tsvector
    GENERATED ALWAYS AS (to_tsvector('english',
      coalesce("name",'')||' '||coalesce("tagline",'')||' '||coalesce("description",'')||' '||coalesce(array_to_string("tags",' '),''))
    ) STORED;
  `);
  await ds.query(`CREATE INDEX idx_skill_search ON "skill" USING GIN ("searchVector");`);
  repo = new SkillRepository();
  // patch ensureInitialized to return this DS
  (globalThis as any)._dataSource = ds;
}, 120_000);

afterAll(async () => {
  await ds.destroy();
  await container.stop();
});

describe("SkillRepository.search", () => {
  it("returns skills filtered by category and ranked by FTS", async () => {
    const skillRepo = ds.getRepository(entities.Skill);
    await skillRepo.save([
      skillRepo.create({ slug: "a11y", name: "A11y Review", tagline: "audit accessibility", description: "WCAG checks", version: "1.0.0", author: "a", repoUrl: "u", homepageUrl: null, licenseSpdx: null, category: "accessibility", tags: ["wcag"], installCount: 0, favoriteCount: 0, featured: false, publishedAt: null, lastSyncedAt: new Date(), deletedAt: null }),
      skillRepo.create({ slug: "crit", name: "Design Critique", tagline: "usability feedback", description: "critique UI", version: "1.0.0", author: "b", repoUrl: "u", homepageUrl: null, licenseSpdx: null, category: "critique", tags: ["ui"], installCount: 0, favoriteCount: 0, featured: false, publishedAt: null, lastSyncedAt: new Date(), deletedAt: null }),
    ]);

    const res = await repo.search({ q: "accessibility", page: 1, pageSize: 10 });
    expect(res.total).toBe(1);
    expect(res.items[0]?.slug).toBe("a11y");

    const byCat = await repo.search({ category: "critique", page: 1, pageSize: 10 });
    expect(byCat.total).toBe(1);
    expect(byCat.items[0]?.slug).toBe("crit");
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
pnpm test lib/db/repositories/skill.repository.test.ts
```

Expected: `repo.search is not a function`.

- [ ] **Step 3: Add `search`, `findBySlug`, `listFeatured`, `listNewest`, `listTrending` to `SkillRepository`**

Append to `lib/db/repositories/skill.repository.ts`:

```ts
export interface SearchArgs {
  q?: string;
  category?: string;
  tag?: string;
  sort?: "popular" | "newest" | "name";
  page: number;
  pageSize: number;
}

export interface SearchResult {
  items: Skill[];
  total: number;
}

// methods inside the class:
async search(args: SearchArgs): Promise<SearchResult> {
  const ds = await ensureInitialized();
  const qb = ds.getRepository(Skill).createQueryBuilder("s").where('"deletedAt" IS NULL');

  if (args.q) {
    qb.andWhere('"searchVector" @@ plainto_tsquery(\'english\', :q)', { q: args.q })
      .addSelect("ts_rank(\"searchVector\", plainto_tsquery('english', :q))", "rank")
      .orderBy("rank", "DESC");
  } else if (args.sort === "newest") {
    qb.orderBy('"publishedAt"', "DESC", "NULLS LAST");
  } else if (args.sort === "name") {
    qb.orderBy('"name"', "ASC");
  } else {
    qb.orderBy('"installCount"', "DESC");
  }

  if (args.category) qb.andWhere('"category" = :category', { category: args.category });
  if (args.tag) qb.andWhere(':tag = ANY("tags")', { tag: args.tag });

  const total = await qb.getCount();
  const items = await qb.skip((args.page - 1) * args.pageSize).take(args.pageSize).getMany();
  return { items, total };
}

async findBySlug(slug: string): Promise<Skill | null> {
  const ds = await ensureInitialized();
  return ds.getRepository(Skill).findOne({ where: { slug, deletedAt: IsNull() } });
}

async listFeatured(limit = 1): Promise<Skill[]> {
  const ds = await ensureInitialized();
  return ds.getRepository(Skill).find({ where: { featured: true, deletedAt: IsNull() }, take: limit });
}

async listNewest(limit = 12): Promise<Skill[]> {
  const ds = await ensureInitialized();
  return ds.getRepository(Skill).find({
    where: { deletedAt: IsNull() },
    order: { publishedAt: "DESC" },
    take: limit,
  });
}

async listTrending(limit = 4): Promise<Skill[]> {
  const ds = await ensureInitialized();
  const rows = await ds.query(
    `SELECT s.* FROM skill s
     JOIN (
       SELECT "skillId", COUNT(*) AS hits FROM install_log
       WHERE "createdAt" > now() - interval '7 days'
       GROUP BY "skillId"
     ) i ON i."skillId" = s.id
     WHERE s."deletedAt" IS NULL
     ORDER BY i.hits DESC
     LIMIT $1`,
    [limit],
  );
  return rows as Skill[];
}
```

- [ ] **Step 4: Run — verify pass**

```bash
pnpm test lib/db/repositories/skill.repository.test.ts
```

Expected: tests pass (Docker must be running).

- [ ] **Step 5: Commit**

```bash
git add lib/db/repositories
git commit -m "feat(db): SkillRepository search and list methods"
```

---

### Task 18: Add `FavoriteRepository` and `InstallLogRepository` (TDD, transactional counters)

**Files:**
- Create: `lib/db/repositories/favorite.repository.ts`, `lib/db/repositories/install-log.repository.ts`, `lib/db/repositories/favorite.repository.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// lib/db/repositories/favorite.repository.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { DataSource } from "typeorm";
import * as entities from "../entities";
import { FavoriteRepository } from "./favorite.repository";
import { Skill } from "../entities";

let container: StartedPostgreSqlContainer;
let ds: DataSource;
let favRepo: FavoriteRepository;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16").start();
  ds = new DataSource({ type: "postgres", url: container.getConnectionUri(), entities: Object.values(entities), synchronize: true });
  await ds.initialize();
  (globalThis as any)._dataSource = ds;
  favRepo = new FavoriteRepository();
}, 120_000);

afterAll(async () => {
  await ds.destroy();
  await container.stop();
});

describe("FavoriteRepository", () => {
  it("increments and decrements favoriteCount atomically", async () => {
    const skillRepo = ds.getRepository(Skill);
    const s = await skillRepo.save(skillRepo.create({
      slug: "x", name: "X", tagline: "t", description: "d", version: "1.0.0",
      author: "a", repoUrl: "u", homepageUrl: null, licenseSpdx: null,
      category: "critique", tags: [], installCount: 0, favoriteCount: 0,
      featured: false, publishedAt: null, lastSyncedAt: new Date(), deletedAt: null,
    }));

    const userId = "00000000-0000-0000-0000-000000000001";
    const r1 = await favRepo.favorite(userId, s.id);
    expect(r1.count).toBe(1);

    // double-favorite is a no-op
    const r2 = await favRepo.favorite(userId, s.id);
    expect(r2.count).toBe(1);

    const r3 = await favRepo.unfavorite(userId, s.id);
    expect(r3.count).toBe(0);
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
pnpm test lib/db/repositories/favorite.repository.test.ts
```

Expected: module not found.

- [ ] **Step 3: Implement `lib/db/repositories/favorite.repository.ts`**

```ts
import { ensureInitialized } from "../data-source";
import { Favorite, Skill } from "../entities";

export class FavoriteRepository {
  async favorite(userId: string, skillId: string): Promise<{ count: number }> {
    const ds = await ensureInitialized();
    return ds.transaction(async (m) => {
      const existing = await m.getRepository(Favorite).findOne({ where: { userId, skillId } });
      if (existing) {
        const skill = await m.getRepository(Skill).findOneByOrFail({ id: skillId });
        return { count: skill.favoriteCount };
      }
      await m.getRepository(Favorite).insert({ userId, skillId });
      await m.getRepository(Skill).increment({ id: skillId }, "favoriteCount", 1);
      const skill = await m.getRepository(Skill).findOneByOrFail({ id: skillId });
      return { count: skill.favoriteCount };
    });
  }

  async unfavorite(userId: string, skillId: string): Promise<{ count: number }> {
    const ds = await ensureInitialized();
    return ds.transaction(async (m) => {
      const res = await m.getRepository(Favorite).delete({ userId, skillId });
      if (res.affected && res.affected > 0) {
        await m.getRepository(Skill).decrement({ id: skillId }, "favoriteCount", 1);
      }
      const skill = await m.getRepository(Skill).findOneByOrFail({ id: skillId });
      return { count: skill.favoriteCount };
    });
  }

  async listForUser(userId: string): Promise<Skill[]> {
    const ds = await ensureInitialized();
    return ds
      .getRepository(Skill)
      .createQueryBuilder("s")
      .innerJoin(Favorite, "f", 'f."skillId" = s.id AND f."userId" = :userId', { userId })
      .where('s."deletedAt" IS NULL')
      .orderBy('f."createdAt"', "DESC")
      .getMany();
  }
}
```

- [ ] **Step 4: Implement `lib/db/repositories/install-log.repository.ts`**

```ts
import { ensureInitialized } from "../data-source";
import { InstallLog, type InstallSource, Skill } from "../entities";

export class InstallLogRepository {
  async log(userId: string | null, skillId: string, source: InstallSource): Promise<void> {
    const ds = await ensureInitialized();
    await ds.transaction(async (m) => {
      await m.getRepository(InstallLog).insert({ userId, skillId, source });
      await m.getRepository(Skill).increment({ id: skillId }, "installCount", 1);
    });
  }

  async listForUser(userId: string, limit = 50): Promise<InstallLog[]> {
    const ds = await ensureInitialized();
    return ds.getRepository(InstallLog).find({ where: { userId }, order: { createdAt: "DESC" }, take: limit });
  }
}
```

- [ ] **Step 5: Run — verify pass**

```bash
pnpm test lib/db/repositories/favorite.repository.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add lib/db/repositories
git commit -m "feat(db): Favorite and InstallLog repositories with transactional counters"
```

---

### Task 19: API routes for search, favorites, installs

**Files:**
- Create: `app/api/skills/route.ts`, `app/api/skills/[slug]/route.ts`, `app/api/favorites/route.ts`, `app/api/favorites/[slug]/route.ts`, `app/api/installs/route.ts`

- [ ] **Step 1: `app/api/skills/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api/handler";
import { SkillRepository } from "@/lib/db/repositories/skill.repository";

const QuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  sort: z.enum(["popular", "newest", "name"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(24),
});

export const GET = withErrorHandler(async (req: Request) => {
  const url = new URL(req.url);
  const args = QuerySchema.parse(Object.fromEntries(url.searchParams));
  const repo = new SkillRepository();
  const result = await repo.search(args);
  return NextResponse.json(result);
});
```

- [ ] **Step 2: `app/api/skills/[slug]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { NotFound } from "@/lib/api/errors";
import { SkillRepository } from "@/lib/db/repositories/skill.repository";

export const GET = withErrorHandler(async (_req: Request, ctx: { params: Promise<{ slug: string }> }) => {
  const { slug } = await ctx.params;
  const skill = await new SkillRepository().findBySlug(slug);
  if (!skill) throw NotFound("skill not found");
  return NextResponse.json(skill);
});
```

- [ ] **Step 3: `app/api/favorites/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api/handler";
import { Unauthorized, NotFound } from "@/lib/api/errors";
import { auth } from "@/lib/auth/server";
import { SkillRepository } from "@/lib/db/repositories/skill.repository";
import { FavoriteRepository } from "@/lib/db/repositories/favorite.repository";

const Body = z.object({ slug: z.string().min(1) });

export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user) throw Unauthorized();
  const { slug } = Body.parse(await req.json());
  const skill = await new SkillRepository().findBySlug(slug);
  if (!skill) throw NotFound("skill not found");
  const res = await new FavoriteRepository().favorite((session.user as { id: string }).id, skill.id);
  return NextResponse.json({ favorited: true, count: res.count });
});
```

- [ ] **Step 4: `app/api/favorites/[slug]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { Unauthorized, NotFound } from "@/lib/api/errors";
import { auth } from "@/lib/auth/server";
import { SkillRepository } from "@/lib/db/repositories/skill.repository";
import { FavoriteRepository } from "@/lib/db/repositories/favorite.repository";

export const DELETE = withErrorHandler(async (_req: Request, ctx: { params: Promise<{ slug: string }> }) => {
  const session = await auth();
  if (!session?.user) throw Unauthorized();
  const { slug } = await ctx.params;
  const skill = await new SkillRepository().findBySlug(slug);
  if (!skill) throw NotFound("skill not found");
  const res = await new FavoriteRepository().unfavorite((session.user as { id: string }).id, skill.id);
  return NextResponse.json({ favorited: false, count: res.count });
});
```

- [ ] **Step 5: `app/api/installs/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api/handler";
import { NotFound } from "@/lib/api/errors";
import { auth } from "@/lib/auth/server";
import { SkillRepository } from "@/lib/db/repositories/skill.repository";
import { InstallLogRepository } from "@/lib/db/repositories/install-log.repository";

const Body = z.object({ slug: z.string().min(1) });

export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  const { slug } = Body.parse(await req.json());
  const skill = await new SkillRepository().findBySlug(slug);
  if (!skill) throw NotFound("skill not found");
  const userId = session?.user ? (session.user as { id: string }).id : null;
  await new InstallLogRepository().log(userId, skill.id, "web");
  return NextResponse.json({ ok: true });
});
```

- [ ] **Step 6: Typecheck**

```bash
pnpm typecheck
```

Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add app/api
git commit -m "feat(api): skills, favorites, installs routes with Zod validation"
```

---

## Phase 5 — UI Shell & Design System

### Task 20: Configure Tailwind theme, fonts, and shadcn/ui

**Files:**
- Modify: `app/globals.css`, `app/layout.tsx`, `tailwind.config.ts` (if present)
- Create: `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/badge.tsx`, `components/ui/skeleton.tsx`, `lib/utils.ts`

- [ ] **Step 1: Create `lib/utils.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

- [ ] **Step 2: Replace `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-accent: #7C5CFF;
  --color-accent-fg: #ffffff;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}

:root {
  --background: #ffffff;
  --foreground: #0a0a0b;
  --muted: #f4f4f5;
  --muted-foreground: #71717a;
  --border: #e4e4e7;
}

.dark {
  --background: #09090b;
  --foreground: #fafafa;
  --muted: #18181b;
  --muted-foreground: #a1a1aa;
  --border: #27272a;
}

html, body { background: var(--background); color: var(--foreground); }
body { font-family: var(--font-sans); }
```

- [ ] **Step 3: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "bentoskills.sh — UI/UX skills for Claude Code",
  description: "A marketplace of UI/UX agent skills for Claude Code.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Create minimal shadcn-style primitives**

`components/ui/button.tsx`:
```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent] disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[--color-accent] text-[--color-accent-fg] hover:brightness-110",
        ghost: "hover:bg-[--muted]",
        outline: "border border-[--border] hover:bg-[--muted]",
      },
      size: { sm: "h-8 px-3", md: "h-10 px-4", lg: "h-12 px-6" },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(button({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
```

`components/ui/input.tsx`:
```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn("flex h-10 w-full rounded-md border border-[--border] bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent]", className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";
```

`components/ui/badge.tsx`:
```tsx
import { cn } from "@/lib/utils";
export function Badge({ className, ...p }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex items-center rounded-full border border-[--border] px-2.5 py-0.5 text-xs", className)} {...p} />;
}
```

`components/ui/skeleton.tsx`:
```tsx
import { cn } from "@/lib/utils";
export function Skeleton({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-[--muted]", className)} {...p} />;
}
```

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx components/ui lib/utils.ts
git commit -m "feat(ui): configure Tailwind theme, fonts, and base primitives"
```

---

### Task 21: Build `SkillCard`, `BentoGrid`, `CommandBlock`, `TagPill`

**Files:**
- Create: `components/skill-card.tsx`, `components/bento-grid.tsx`, `components/command-block.tsx`, `components/tag-pill.tsx`

- [ ] **Step 1: `components/tag-pill.tsx`**

```tsx
import Link from "next/link";
export function TagPill({ tag }: { tag: string }) {
  return (
    <Link
      href={`/skills?tag=${encodeURIComponent(tag)}`}
      className="inline-flex h-6 items-center rounded-full border border-[--border] px-2 text-xs text-[--muted-foreground] hover:bg-[--muted]"
    >
      #{tag}
    </Link>
  );
}
```

- [ ] **Step 2: `components/bento-grid.tsx`**

```tsx
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function BentoGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:grid-rows-[repeat(3,12rem)]", className)}>
      {children}
    </div>
  );
}

export function BentoTile({
  children,
  size = "sm",
  className,
}: {
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const spans = {
    sm: "md:col-span-1 md:row-span-1",
    md: "md:col-span-2 md:row-span-1",
    lg: "md:col-span-2 md:row-span-2",
    xl: "md:col-span-3 md:row-span-2",
  }[size];
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-[--border] bg-[--background] p-6", spans, className)}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: `components/command-block.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CommandBlock({ command, slug }: { command: string; slug?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    if (slug) {
      fetch("/api/installs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug }),
      }).catch(() => {});
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-[--border] bg-[--muted] px-3 py-2 font-mono text-sm">
      <code>{command}</code>
      <Button variant="ghost" size="sm" onClick={copy}>
        {copied ? "copied" : "copy"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: `components/skill-card.tsx`**

```tsx
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TagPill } from "./tag-pill";
import type { Skill } from "@/lib/db/entities";

export function SkillCard({ skill, variant = "compact" }: { skill: Skill; variant?: "compact" | "feature" }) {
  return (
    <Link
      href={`/skills/${skill.slug}`}
      className="group block rounded-2xl border border-[--border] p-5 transition hover:border-[--color-accent]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className={variant === "feature" ? "text-2xl font-semibold" : "text-base font-semibold"}>{skill.name}</h3>
        <Badge>{skill.category}</Badge>
      </div>
      <p className="mt-2 text-sm text-[--muted-foreground] line-clamp-2">{skill.tagline}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {skill.tags.slice(0, 4).map((t) => (
          <TagPill key={t} tag={t} />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-[--muted-foreground]">
        <span>{skill.installCount} installs</span>
        <span>{skill.favoriteCount} favorites</span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add components
git commit -m "feat(ui): SkillCard, BentoGrid, CommandBlock, TagPill"
```

---

### Task 22: Build the homepage (`/`)

**Files:**
- Replace: `app/page.tsx`
- Create: `app/(marketing)/layout.tsx`

- [ ] **Step 1: Create `app/(marketing)/layout.tsx`**

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex items-center justify-between pb-10">
        <Link href="/" className="text-lg font-semibold">bentoskills<span className="text-[--color-accent]">.sh</span></Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/skills">Browse</Link>
          <Link href="/publish">Publish</Link>
          <Button size="sm" variant="outline" asChild>
            <Link href="/api/auth/signin">Sign in</Link>
          </Button>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-[--border] pt-8 text-sm text-[--muted-foreground]">
        <p>Open a PR at <a className="underline" href="https://github.com/bentoskills/registry">bentoskills/registry</a> to publish a skill.</p>
      </footer>
    </div>
  );
}
```

Note: `<Button asChild>` needs a small addition — accept a `asChild` prop that renders the `Slot` from Radix. Simplify: drop `asChild` and wrap the button in a link instead.

Revised nav snippet:
```tsx
<Link href="/api/auth/signin" className="inline-flex h-8 items-center rounded-md border border-[--border] px-3 text-sm hover:bg-[--muted]">Sign in</Link>
```

- [ ] **Step 2: Replace `app/page.tsx`**

```tsx
import { SkillRepository } from "@/lib/db/repositories/skill.repository";
import { BentoGrid, BentoTile } from "@/components/bento-grid";
import { CommandBlock } from "@/components/command-block";
import { SkillCard } from "@/components/skill-card";
import Link from "next/link";

export const revalidate = 300;

export default async function HomePage() {
  const repo = new SkillRepository();
  const [featured, trending, newest] = await Promise.all([
    repo.listFeatured(1),
    repo.listTrending(4),
    repo.listNewest(8),
  ]);

  return (
    <div className="space-y-12">
      <BentoGrid>
        <BentoTile size="xl">
          <h1 className="text-4xl font-semibold tracking-tight">UI/UX skills for Claude Code.</h1>
          <p className="mt-3 max-w-xl text-[--muted-foreground]">Agent skills that make your interfaces better — design critique, accessibility review, UX copy, handoff specs.</p>
          <div className="mt-6 max-w-md">
            <CommandBlock command="npx bentoskills install design-critique" />
          </div>
        </BentoTile>
        {featured[0] && (
          <BentoTile size="lg">
            <span className="text-xs uppercase text-[--muted-foreground]">Featured</span>
            <div className="mt-2"><SkillCard skill={featured[0]} variant="feature" /></div>
          </BentoTile>
        )}
        {trending.slice(0, 3).map((s) => (
          <BentoTile key={s.id} size="md">
            <SkillCard skill={s} />
          </BentoTile>
        ))}
      </BentoGrid>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">New this week</h2>
          <Link href="/skills?sort=newest" className="text-sm text-[--muted-foreground] hover:underline">See all</Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {newest.map((s) => <SkillCard key={s.id} skill={s} />)}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app
git commit -m "feat(ui): bento homepage with featured, trending, newest sections"
```

---

### Task 23: Build `/skills` browse page

**Files:**
- Create: `app/(marketing)/skills/page.tsx`

- [ ] **Step 1: Create `app/(marketing)/skills/page.tsx`**

```tsx
import Link from "next/link";
import { SkillRepository } from "@/lib/db/repositories/skill.repository";
import { SkillCard } from "@/components/skill-card";

const CATEGORIES = ["accessibility", "critique", "copy", "handoff", "research", "system"] as const;

interface SearchParams {
  q?: string;
  category?: string;
  tag?: string;
  sort?: "popular" | "newest" | "name";
  page?: string;
}

export default async function BrowsePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));
  const pageSize = 24;
  const repo = new SkillRepository();
  const { items, total } = await repo.search({
    q: sp.q,
    category: sp.category,
    tag: sp.tag,
    sort: sp.sort,
    page,
    pageSize,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
      <aside className="space-y-6">
        <div>
          <h3 className="mb-2 text-xs uppercase text-[--muted-foreground]">Category</h3>
          <ul className="space-y-1 text-sm">
            <li><Link href="/skills" className={!sp.category ? "font-semibold" : ""}>All</Link></li>
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link href={`/skills?category=${c}`} className={sp.category === c ? "font-semibold" : ""}>
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-xs uppercase text-[--muted-foreground]">Sort</h3>
          <ul className="space-y-1 text-sm">
            <li><Link href={`/skills?sort=popular`}>Popular</Link></li>
            <li><Link href={`/skills?sort=newest`}>Newest</Link></li>
            <li><Link href={`/skills?sort=name`}>A–Z</Link></li>
          </ul>
        </div>
      </aside>

      <div>
        <div className="mb-4 text-sm text-[--muted-foreground]">{total} skills</div>
        {items.length === 0 ? (
          <p className="text-[--muted-foreground]">No skills match.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => <SkillCard key={s.id} skill={s} />)}
          </div>
        )}
        {totalPages > 1 && (
          <div className="mt-6 flex gap-2 text-sm">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const params = new URLSearchParams({ ...sp, page: String(p) } as Record<string, string>);
              return (
                <Link key={p} href={`/skills?${params}`} className={p === page ? "font-semibold underline" : ""}>
                  {p}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(marketing\)/skills
git commit -m "feat(ui): browse page with category, sort, pagination"
```

---

### Task 24: Build `/skills/[slug]` detail page with rendered README

**Files:**
- Create: `app/(marketing)/skills/[slug]/page.tsx`, `lib/markdown.ts`, `components/markdown-view.tsx`

- [ ] **Step 1: Create `lib/markdown.ts`**

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

export async function renderMarkdown(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(md);
  return String(file);
}
```

Install `unified`:
```bash
pnpm add unified
```

- [ ] **Step 2: Create `components/markdown-view.tsx`**

```tsx
export function MarkdownView({ html }: { html: string }) {
  return (
    <div
      className="prose prose-zinc max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

Install Tailwind typography:
```bash
pnpm add -D @tailwindcss/typography
```

Add to `app/globals.css`:
```css
@plugin "@tailwindcss/typography";
```

- [ ] **Step 3: Create `app/(marketing)/skills/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { SkillRepository } from "@/lib/db/repositories/skill.repository";
import { CommandBlock } from "@/components/command-block";
import { Badge } from "@/components/ui/badge";
import { TagPill } from "@/components/tag-pill";
import { MarkdownView } from "@/components/markdown-view";
import { renderMarkdown } from "@/lib/markdown";

export default async function SkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = await new SkillRepository().findBySlug(slug);
  if (!skill) notFound();
  const html = await renderMarkdown(skill.description);

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_320px]">
      <article>
        <h1 className="text-3xl font-semibold tracking-tight">{skill.name}</h1>
        <p className="mt-2 text-[--muted-foreground]">{skill.tagline}</p>
        <div className="mt-8"><MarkdownView html={html} /></div>
      </article>

      <aside className="sticky top-6 h-fit space-y-4 rounded-2xl border border-[--border] p-5">
        <div>
          <Badge>{skill.category}</Badge>
        </div>
        <CommandBlock command={`npx bentoskills install ${skill.slug}`} slug={skill.slug} />
        <details className="text-sm">
          <summary className="cursor-pointer text-[--muted-foreground]">Manual install</summary>
          <pre className="mt-2 rounded bg-[--muted] p-3 text-xs">
{`git clone ${skill.repoUrl} ~/.claude/skills/${skill.slug}`}
          </pre>
        </details>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-[--muted-foreground]">Version</dt><dd>{skill.version}</dd></div>
          <div className="flex justify-between"><dt className="text-[--muted-foreground]">Author</dt><dd>{skill.author}</dd></div>
          <div className="flex justify-between"><dt className="text-[--muted-foreground]">Installs</dt><dd>{skill.installCount}</dd></div>
          <div className="flex justify-between"><dt className="text-[--muted-foreground]">Favorites</dt><dd>{skill.favoriteCount}</dd></div>
        </dl>
        <div className="flex flex-wrap gap-1.5">
          {skill.tags.map((t) => <TagPill key={t} tag={t} />)}
        </div>
        <Link href={skill.repoUrl} className="block text-sm underline">View on GitHub →</Link>
      </aside>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/\(marketing\)/skills/\[slug\] components/markdown-view.tsx lib/markdown.ts app/globals.css package.json pnpm-lock.yaml
git commit -m "feat(ui): skill detail page with rendered README"
```

---

### Task 25: Build `/me` account page

**Files:**
- Create: `app/(app)/layout.tsx`, `app/(app)/me/page.tsx`

- [ ] **Step 1: Create `app/(app)/layout.tsx`**

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/me");
  return <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>;
}
```

- [ ] **Step 2: Create `app/(app)/me/page.tsx`**

```tsx
import { auth } from "@/lib/auth/server";
import { FavoriteRepository } from "@/lib/db/repositories/favorite.repository";
import { InstallLogRepository } from "@/lib/db/repositories/install-log.repository";
import { SkillCard } from "@/components/skill-card";

export default async function MePage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;
  const [favs, installs] = await Promise.all([
    new FavoriteRepository().listForUser(userId),
    new InstallLogRepository().listForUser(userId, 20),
  ]);

  return (
    <div className="space-y-12">
      <section>
        <h2 className="mb-4 text-xl font-semibold">Favorites</h2>
        {favs.length === 0 ? (
          <p className="text-[--muted-foreground]">No favorites yet. Browse and heart a skill.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favs.map((s) => <SkillCard key={s.id} skill={s} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Recent installs</h2>
        {installs.length === 0 ? (
          <p className="text-[--muted-foreground]">No installs yet.</p>
        ) : (
          <ul className="divide-y divide-[--border] rounded-2xl border border-[--border]">
            {installs.map((i) => (
              <li key={i.id} className="flex justify-between p-4 text-sm">
                <span>{i.skillId}</span>
                <span className="text-[--muted-foreground]">{new Date(i.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)
git commit -m "feat(ui): account page with favorites and install history"
```

---

### Task 26: Build the `/publish` docs page

**Files:**
- Create: `app/(marketing)/publish/page.tsx`

- [ ] **Step 1: Create `app/(marketing)/publish/page.tsx`**

```tsx
export default function PublishPage() {
  return (
    <article className="prose prose-zinc max-w-none dark:prose-invert">
      <h1>Publish a skill</h1>
      <p>bentoskills.sh is backed by a public GitHub registry. To publish:</p>
      <ol>
        <li>Fork <a href="https://github.com/bentoskills/registry"><code>bentoskills/registry</code></a>.</li>
        <li>Add a folder under <code>skills/&lt;slug&gt;/</code> containing <code>skill.yaml</code> and <code>README.md</code>.</li>
        <li>Add an entry to <code>registry.json</code>.</li>
        <li>Open a pull request.</li>
      </ol>
      <h2><code>skill.yaml</code> schema</h2>
      <pre><code>{`slug: design-critique           # required, [a-z0-9-]+
name: Design Critique           # required
tagline: Get structured ...     # required, ≤140 chars
version: 1.2.0                  # required, semver
author: alice                   # required, GitHub login
category: critique              # one of: accessibility | critique | copy | handoff | research | system
tags: [ui, feedback]            # optional
license: MIT                    # optional SPDX id
homepage: https://...           # optional
publishedAt: 2026-03-01         # optional ISO date`}</code></pre>
    </article>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(marketing\)/publish
git commit -m "docs: publish-a-skill page with schema reference"
```

---

## Phase 6 — Favorite button & hardening

### Task 27: Add interactive `FavoriteButton` client component

**Files:**
- Create: `components/favorite-button.tsx`
- Modify: `app/(marketing)/skills/[slug]/page.tsx`

- [ ] **Step 1: Create `components/favorite-button.tsx`**

```tsx
"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function FavoriteButton({ slug, initialFavorited, initialCount }: { slug: string; initialFavorited: boolean; initialCount: number }) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const nextFavorited = !favorited;
    setFavorited(nextFavorited);
    setCount((c) => c + (nextFavorited ? 1 : -1));
    startTransition(async () => {
      try {
        const res = await fetch(`/api/favorites${nextFavorited ? "" : "/" + slug}`, {
          method: nextFavorited ? "POST" : "DELETE",
          headers: { "content-type": "application/json" },
          body: nextFavorited ? JSON.stringify({ slug }) : undefined,
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCount(data.count);
      } catch {
        setFavorited(!nextFavorited);
        setCount((c) => c + (nextFavorited ? -1 : 1));
      }
    });
  }

  return (
    <Button variant={favorited ? "default" : "outline"} onClick={toggle} disabled={pending}>
      {favorited ? "★ Favorited" : "☆ Favorite"} · {count}
    </Button>
  );
}
```

- [ ] **Step 2: Wire it into the detail page**

In `app/(marketing)/skills/[slug]/page.tsx`, after fetching `skill`, also fetch the user's favorite state:

```tsx
import { auth } from "@/lib/auth/server";
import { FavoriteButton } from "@/components/favorite-button";
// ...
const session = await auth();
let isFavorited = false;
if (session?.user) {
  const ds = await (await import("@/lib/db/data-source")).ensureInitialized();
  const fav = await ds.getRepository((await import("@/lib/db/entities")).Favorite)
    .findOne({ where: { userId: (session.user as { id: string }).id, skillId: skill.id } });
  isFavorited = !!fav;
}
```

And in the aside, add:
```tsx
{session?.user && (
  <FavoriteButton slug={skill.slug} initialFavorited={isFavorited} initialCount={skill.favoriteCount} />
)}
```

- [ ] **Step 3: Commit**

```bash
git add components/favorite-button.tsx app/\(marketing\)/skills/\[slug\]/page.tsx
git commit -m "feat(ui): optimistic favorite button on skill detail page"
```

---

### Task 28: Add security headers

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Replace `next.config.ts`**

```ts
import type { NextConfig } from "next";

const config: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "img-src 'self' data: https://avatars.githubusercontent.com",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default config;
```

- [ ] **Step 2: Commit**

```bash
git add next.config.ts
git commit -m "chore(security): add strict security headers"
```

---

### Task 29: Add Playwright smoke test

**Files:**
- Create: `playwright.config.ts`, `e2e/smoke.spec.ts`

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: "http://localhost:3000" },
});
```

- [ ] **Step 2: Create `e2e/smoke.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("homepage renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("UI/UX skills for Claude Code.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("browse page renders", async ({ page }) => {
  await page.goto("/skills");
  await expect(page.getByText(/skills$/i)).toBeVisible();
});
```

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts e2e
git commit -m "test(e2e): Playwright smoke tests"
```

---

### Task 30: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready --health-interval 10s
          --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
      - run: pnpm build
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
          NEXTAUTH_SECRET: ci-secret
          GITHUB_ID: ci
          GITHUB_SECRET: ci
          CRON_SECRET: ci
```

- [ ] **Step 2: Commit**

```bash
git add .github
git commit -m "ci: GitHub Actions workflow with Postgres service"
```

---

## Phase 7 — Seed & Manual Verification

### Task 31: Seed the dev DB with 6 hand-crafted skills

**Files:**
- Create: `scripts/seed.ts`
- Modify: `package.json` (add `db:seed` script)

- [ ] **Step 1: Create `scripts/seed.ts`**

```ts
import "dotenv/config";
import "reflect-metadata";
import { ensureInitialized } from "@/lib/db/data-source";
import { Skill } from "@/lib/db/entities";

const skills: Partial<Skill>[] = [
  { slug: "design-critique", name: "Design Critique", tagline: "Get structured design feedback on usability and hierarchy.", description: "# Design Critique\n\nAsk for opinionated feedback on any UI.", version: "1.0.0", author: "alice", repoUrl: "https://github.com/bentoskills/registry/tree/main/skills/design-critique", homepageUrl: null, licenseSpdx: "MIT", category: "critique", tags: ["ui", "feedback"], featured: true, installCount: 0, favoriteCount: 0, publishedAt: new Date(), lastSyncedAt: new Date(), deletedAt: null },
  { slug: "accessibility-review", name: "Accessibility Review", tagline: "Run a WCAG 2.1 AA audit on your UI.", description: "# Accessibility Review\n\nWCAG audit skill.", version: "1.0.0", author: "bob", repoUrl: "https://github.com/bentoskills/registry/tree/main/skills/accessibility-review", homepageUrl: null, licenseSpdx: "MIT", category: "accessibility", tags: ["wcag", "a11y"], featured: false, installCount: 0, favoriteCount: 0, publishedAt: new Date(), lastSyncedAt: new Date(), deletedAt: null },
  { slug: "ux-copy", name: "UX Copy", tagline: "Write and review microcopy, errors, and empty states.", description: "# UX Copy\n\nMicrocopy skill.", version: "1.0.0", author: "carol", repoUrl: "https://github.com/bentoskills/registry/tree/main/skills/ux-copy", homepageUrl: null, licenseSpdx: "MIT", category: "copy", tags: ["copy"], featured: false, installCount: 0, favoriteCount: 0, publishedAt: new Date(), lastSyncedAt: new Date(), deletedAt: null },
  { slug: "design-handoff", name: "Design Handoff", tagline: "Generate developer handoff specs from a design.", description: "# Design Handoff\n\nHandoff skill.", version: "1.0.0", author: "dave", repoUrl: "https://github.com/bentoskills/registry/tree/main/skills/design-handoff", homepageUrl: null, licenseSpdx: "MIT", category: "handoff", tags: ["handoff"], featured: false, installCount: 0, favoriteCount: 0, publishedAt: new Date(), lastSyncedAt: new Date(), deletedAt: null },
  { slug: "user-research", name: "User Research", tagline: "Plan, conduct, and synthesize user research.", description: "# User Research\n\nResearch skill.", version: "1.0.0", author: "eve", repoUrl: "https://github.com/bentoskills/registry/tree/main/skills/user-research", homepageUrl: null, licenseSpdx: "MIT", category: "research", tags: ["research"], featured: false, installCount: 0, favoriteCount: 0, publishedAt: new Date(), lastSyncedAt: new Date(), deletedAt: null },
  { slug: "design-system", name: "Design System", tagline: "Audit, document, or extend your design system.", description: "# Design System\n\nSystem skill.", version: "1.0.0", author: "frank", repoUrl: "https://github.com/bentoskills/registry/tree/main/skills/design-system", homepageUrl: null, licenseSpdx: "MIT", category: "system", tags: ["tokens"], featured: false, installCount: 0, favoriteCount: 0, publishedAt: new Date(), lastSyncedAt: new Date(), deletedAt: null },
];

async function main() {
  const ds = await ensureInitialized();
  const repo = ds.getRepository(Skill);
  for (const s of skills) {
    const existing = await repo.findOne({ where: { slug: s.slug! } });
    if (existing) await repo.save({ ...existing, ...s });
    else await repo.save(repo.create(s));
  }
  console.log(`seeded ${skills.length} skills`);
  await ds.destroy();
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Add `db:seed` script**

In `package.json` `scripts`:
```json
"db:seed": "tsx scripts/seed.ts"
```

- [ ] **Step 3: Run seed**

```bash
pnpm db:seed
```

Expected: `seeded 6 skills`.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed.ts package.json
git commit -m "chore: seed script with 6 starter skills"
```

---

### Task 32: Manual verification checklist

**Files:** none.

- [ ] **Step 1: Run dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Manually verify each screen**

Open `http://localhost:3000` and walk through:
- [ ] Homepage renders bento grid with hero, featured, trending (may be empty), and "New this week".
- [ ] `/skills` shows the 6 seeded skills in the grid.
- [ ] `/skills?category=accessibility` filters to one skill.
- [ ] `/skills?q=design` returns ranked results (full-text search works).
- [ ] `/skills/design-critique` renders the README and sidebar with install command.
- [ ] Clicking "copy" on an install command fires `POST /api/installs` (check network tab and `install_log` table).
- [ ] `/api/auth/signin` starts the GitHub OAuth flow (requires `GITHUB_ID`/`GITHUB_SECRET` configured).
- [ ] After sign-in, `/me` renders (empty state until favorites exist).
- [ ] Favoriting a skill on the detail page persists across reload.
- [ ] `/publish` renders the docs.
- [ ] Lighthouse a11y audit on `/` ≥ 95.

- [ ] **Step 3: Verify the cron route locally**

```bash
curl -X POST http://localhost:3000/api/cron/sync-registry \
  -H "Authorization: Bearer $CRON_SECRET"
```

Expected: JSON with `{ added, updated, removed, errors }`. (Will 404 or error if the registry repo doesn't yet exist — create an empty `bentoskills/registry` repo with a `registry.json` of `[]` for a clean no-op, or skip for now and test on Vercel.)

- [ ] **Step 4: Final commit if docs updated**

```bash
git add -A
git commit -m "docs: v1 manual verification checklist" || true
```

---

## Self-Review

**Spec coverage:**
- §1 Product → Tasks 22–26 (UI) + Task 14 (sync) + Task 31 (seed). ✓
- §2 Architecture → Tasks 1–4, 15, 20. ✓
- §3 Data model → Tasks 5–9 cover every entity, index, and the tsvector generated column. ✓
- §4a Registry sync → Tasks 10–14. ✓
- §4b Read path → Tasks 17, 19, 22–24. ✓
- §4c Write path → Tasks 15, 18, 19, 27. ✓
- §5 UI/UX & design system → Tasks 20–26. ✓
- §6 Testing → Tasks 3, 10, 13, 17, 18, 29. ✓
- §6 Error handling → Task 16 (`withErrorHandler`, `HttpError`). ✓
- §6 Security → Tasks 28 (headers) + cron secret in 14 + sanitized markdown in 24. ✓
- §6 Observability → Task 14 (pino) + sync result logged. ✓
- §7 Env → Task 1 (`.env.local.example`). ✓
- §8 Phase-2 items — intentionally out of scope.

**Placeholder scan:** None. Every step has the code or the exact command.

**Type consistency:** `SkillRepository`, `FavoriteRepository`, `InstallLogRepository` names and method signatures match between definition (Tasks 12, 17, 18) and consumption (Tasks 14, 19, 22–27). `ParsedSkill`, `SyncResult`, `HttpError`, `SkillCategory` consistent across tasks. `ensureInitialized` used consistently. The `Button asChild` slip in Task 22 Step 1 is called out and replaced inline. `auth()` from `lib/auth/server.ts` used consistently.

**Known tradeoffs made explicit:**
- `searchVector` generated column is raw-SQL in migration, not a TypeORM decorator — intentional.
- `FavoriteButton` optimistically updates count even if the server returns a different value (server value wins on success, rollback on failure) — intentional.
- Rate limiting deferred within each route (§6 says Upstash optional) — plan leaves it out of v1 execution per the spec's "acceptable at v1 traffic" note.

Plan ends in a shippable state: migrations applied, seed data present, all read/write paths wired, auth working, security headers set, CI green.
