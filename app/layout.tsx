import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeScript } from "@/components/theme-script";
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
      <body className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50 dark:from-slate-950 dark:via-purple-950/40 dark:to-slate-950">
        <ThemeScript />
        {/* Ambient color blobs on every page */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-fuchsia-300/30 blur-3xl dark:bg-fuchsia-600/20" />
          <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-600/20" />
          <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-600/15" />
        </div>
        {children}
      </body>
    </html>
  );
}
