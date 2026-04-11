"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function FavoriteButton({
  slug,
  initialFavorited,
  initialCount,
}: {
  slug: string;
  initialFavorited: boolean;
  initialCount: number;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const nextFavorited = !favorited;
    setFavorited(nextFavorited);
    setCount((c) => c + (nextFavorited ? 1 : -1));
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/favorites${nextFavorited ? "" : "/" + slug}`,
          {
            method: nextFavorited ? "POST" : "DELETE",
            headers: { "content-type": "application/json" },
            body: nextFavorited ? JSON.stringify({ slug }) : undefined,
          },
        );
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
    <Button
      variant={favorited ? "default" : "outline"}
      onClick={toggle}
      disabled={pending}
    >
      {favorited ? "★ Favorited" : "☆ Favorite"} · {count}
    </Button>
  );
}
