import Link from "next/link";
import { StarButton } from "@/components/star-button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="flex items-center justify-between pb-10">
        <Link href="/" className="text-lg font-semibold">
          bentoskills<span className="text-[--color-accent]">.sh</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/skills" className="hover:text-[--color-accent]">
            Browse
          </Link>
          <Link href="/contributors" className="hover:text-[--color-accent]">
            Contributors
          </Link>
          <Link href="/publish" className="hover:text-[--color-accent]">
            Publish
          </Link>
          <StarButton />
          <ThemeToggle />
          <Link
            href="/api/auth/signin"
            className="inline-flex h-8 items-center rounded-md border border-[--border] px-3 text-sm hover:bg-[--muted]"
          >
            Sign in
          </Link>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-[--border] pt-8 text-sm text-[--muted-foreground]">
        <p>
          Open a PR at{" "}
          <a className="underline" href="https://github.com/amit-biswas-1992/bentoskills-registry">
            amit-biswas-1992/bentoskills-registry
          </a>{" "}
          to publish a skill.
        </p>
      </footer>
    </div>
  );
}
