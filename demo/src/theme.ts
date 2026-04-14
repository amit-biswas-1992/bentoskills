export const theme = {
  background: "#0A0A0B",
  surface: "#09090b",
  muted: "#18181b",
  mutedFg: "#a1a1aa",
  border: "#27272a",
  fg: "#fafafa",
  accent: "#7C5CFF",
  accentSoft: "rgba(124, 92, 255, 0.12)",
  fontSans:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif",
  fontMono:
    "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
};

export type Skill = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  tags: string[];
  installs: number;
  favorites: number;
};

export const skills: Skill[] = [
  {
    slug: "design-critique",
    name: "Design Critique",
    tagline: "Get structured design feedback on usability and hierarchy.",
    category: "critique",
    tags: ["ui", "feedback"],
    installs: 1284,
    favorites: 312,
  },
  {
    slug: "accessibility-review",
    name: "Accessibility Review",
    tagline: "Run a WCAG 2.1 AA audit on your UI.",
    category: "accessibility",
    tags: ["wcag", "a11y"],
    installs: 964,
    favorites: 221,
  },
  {
    slug: "ux-copy",
    name: "UX Copy",
    tagline: "Write and review microcopy, errors, and empty states.",
    category: "copy",
    tags: ["copy"],
    installs: 712,
    favorites: 160,
  },
  {
    slug: "design-handoff",
    name: "Design Handoff",
    tagline: "Generate developer handoff specs from a design.",
    category: "handoff",
    tags: ["handoff"],
    installs: 508,
    favorites: 121,
  },
  {
    slug: "user-research",
    name: "User Research",
    tagline: "Plan, conduct, and synthesize user research.",
    category: "research",
    tags: ["research"],
    installs: 433,
    favorites: 98,
  },
  {
    slug: "design-system",
    name: "Design System",
    tagline: "Audit, document, or extend your design system.",
    category: "system",
    tags: ["tokens"],
    installs: 355,
    favorites: 77,
  },
];
