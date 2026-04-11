import { notFound } from "next/navigation";
import Link from "next/link";
import { SkillRepository } from "@/lib/db/repositories/skill.repository";
import { CommandBlock } from "@/components/command-block";
import { Badge } from "@/components/ui/badge";
import { TagPill } from "@/components/tag-pill";
import { MarkdownView } from "@/components/markdown-view";
import { renderMarkdown } from "@/lib/markdown";

export default async function SkillPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const skill = await new SkillRepository().findBySlug(slug);
  if (!skill) notFound();
  const html = await renderMarkdown(skill.description);

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_320px]">
      <article>
        <h1 className="text-3xl font-semibold tracking-tight">{skill.name}</h1>
        <p className="mt-2 text-[--muted-foreground]">{skill.tagline}</p>
        <div className="mt-8">
          <MarkdownView html={html} />
        </div>
      </article>

      <aside className="sticky top-6 h-fit space-y-4 rounded-2xl border border-[--border] p-5">
        <div>
          <Badge>{skill.category}</Badge>
        </div>
        <CommandBlock command={`npx bentoskills install ${skill.slug}`} slug={skill.slug} />
        <details className="text-sm">
          <summary className="cursor-pointer text-[--muted-foreground]">Manual install</summary>
          <pre className="mt-2 overflow-auto rounded bg-[--muted] p-3 text-xs">{`git clone ${skill.repoUrl} ~/.claude/skills/${skill.slug}`}</pre>
        </details>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[--muted-foreground]">Version</dt>
            <dd>{skill.version}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[--muted-foreground]">Author</dt>
            <dd>{skill.author}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[--muted-foreground]">Installs</dt>
            <dd>{skill.installCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[--muted-foreground]">Favorites</dt>
            <dd>{skill.favoriteCount}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-1.5">
          {skill.tags.map((t) => (
            <TagPill key={t} tag={t} />
          ))}
        </div>
        <Link href={skill.repoUrl} className="block text-sm underline">
          View on GitHub →
        </Link>
      </aside>
    </div>
  );
}
