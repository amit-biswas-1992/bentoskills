import "reflect-metadata";
import { config } from "dotenv";
config({ path: ".env.local" });
import { ensureInitialized } from "@/lib/db/data-source";
import { Skill } from "@/lib/db/entities";

const skills: Partial<Skill>[] = [
  {
    slug: "design-critique",
    name: "Design Critique",
    tagline: "Get structured design feedback on usability and hierarchy.",
    description: "# Design Critique\n\nAsk for opinionated feedback on any UI.",
    version: "1.0.0",
    author: "alice",
    repoUrl:
      "https://github.com/amit-biswas-1992/bentoskills-registry/tree/main/skills/design-critique",
    homepageUrl: null,
    licenseSpdx: "MIT",
    category: "critique",
    tags: ["ui", "feedback"],
    featured: true,
    installCount: 0,
    favoriteCount: 0,
    publishedAt: new Date(),
    lastSyncedAt: new Date(),
    deletedAt: null,
  },
  {
    slug: "accessibility-review",
    name: "Accessibility Review",
    tagline: "Run a WCAG 2.1 AA audit on your UI.",
    description: "# Accessibility Review\n\nWCAG audit skill.",
    version: "1.0.0",
    author: "bob",
    repoUrl:
      "https://github.com/amit-biswas-1992/bentoskills-registry/tree/main/skills/accessibility-review",
    homepageUrl: null,
    licenseSpdx: "MIT",
    category: "accessibility",
    tags: ["wcag", "a11y"],
    featured: false,
    installCount: 0,
    favoriteCount: 0,
    publishedAt: new Date(),
    lastSyncedAt: new Date(),
    deletedAt: null,
  },
  {
    slug: "ux-copy",
    name: "UX Copy",
    tagline: "Write and review microcopy, errors, and empty states.",
    description: "# UX Copy\n\nMicrocopy skill.",
    version: "1.0.0",
    author: "carol",
    repoUrl:
      "https://github.com/amit-biswas-1992/bentoskills-registry/tree/main/skills/ux-copy",
    homepageUrl: null,
    licenseSpdx: "MIT",
    category: "copy",
    tags: ["copy"],
    featured: false,
    installCount: 0,
    favoriteCount: 0,
    publishedAt: new Date(),
    lastSyncedAt: new Date(),
    deletedAt: null,
  },
  {
    slug: "design-handoff",
    name: "Design Handoff",
    tagline: "Generate developer handoff specs from a design.",
    description: "# Design Handoff\n\nHandoff skill.",
    version: "1.0.0",
    author: "dave",
    repoUrl:
      "https://github.com/amit-biswas-1992/bentoskills-registry/tree/main/skills/design-handoff",
    homepageUrl: null,
    licenseSpdx: "MIT",
    category: "handoff",
    tags: ["handoff"],
    featured: false,
    installCount: 0,
    favoriteCount: 0,
    publishedAt: new Date(),
    lastSyncedAt: new Date(),
    deletedAt: null,
  },
  {
    slug: "user-research",
    name: "User Research",
    tagline: "Plan, conduct, and synthesize user research.",
    description: "# User Research\n\nResearch skill.",
    version: "1.0.0",
    author: "eve",
    repoUrl:
      "https://github.com/amit-biswas-1992/bentoskills-registry/tree/main/skills/user-research",
    homepageUrl: null,
    licenseSpdx: "MIT",
    category: "research",
    tags: ["research"],
    featured: false,
    installCount: 0,
    favoriteCount: 0,
    publishedAt: new Date(),
    lastSyncedAt: new Date(),
    deletedAt: null,
  },
  {
    slug: "design-system",
    name: "Design System",
    tagline: "Audit, document, or extend your design system.",
    description: "# Design System\n\nSystem skill.",
    version: "1.0.0",
    author: "frank",
    repoUrl:
      "https://github.com/amit-biswas-1992/bentoskills-registry/tree/main/skills/design-system",
    homepageUrl: null,
    licenseSpdx: "MIT",
    category: "system",
    tags: ["tokens"],
    featured: false,
    installCount: 0,
    favoriteCount: 0,
    publishedAt: new Date(),
    lastSyncedAt: new Date(),
    deletedAt: null,
  },
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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
