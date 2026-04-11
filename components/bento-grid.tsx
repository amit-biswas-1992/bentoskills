import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function BentoGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:grid-rows-[repeat(3,12rem)]",
        className,
      )}
    >
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
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[--border] bg-[--background] p-6",
        spans,
        className,
      )}
    >
      {children}
    </div>
  );
}
