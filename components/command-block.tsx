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
      <code className="truncate">{command}</code>
      <Button variant="ghost" size="sm" onClick={copy}>
        {copied ? "copied" : "copy"}
      </Button>
    </div>
  );
}
