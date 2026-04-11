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
