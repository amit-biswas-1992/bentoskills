import Link from "next/link";
import { cn } from "@/lib/utils";

export function TagPill({ tag, className }: { tag: string; className?: string }) {
  return (
    <Link
      href={`/skills?tag=${encodeURIComponent(tag)}`}
      className={cn(
        "relative inline-flex h-6 items-center rounded-full border border-[--border] px-2 text-xs text-[--muted-foreground] hover:bg-[--muted]",
        className,
      )}
    >
      #{tag}
    </Link>
  );
}
