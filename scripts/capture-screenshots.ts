/**
 * Capture screenshots of the running dev server for the README.
 *
 * Usage:
 *   pnpm dev  # in another terminal
 *   pnpm tsx scripts/capture-screenshots.ts
 *
 * Writes full-resolution PNGs into docs/ so the README can embed them.
 */

import { chromium } from "@playwright/test";
import path from "node:path";
import fs from "node:fs/promises";

const BASE = "http://localhost:3000";
const OUT = path.join(process.cwd(), "docs");

type Shot = { path: string; file: string; fullPage?: boolean; darkMode?: boolean };

const shots: Shot[] = [
  { path: "/", file: "home.png", fullPage: false },
  { path: "/", file: "home-dark.png", fullPage: false, darkMode: true },
  { path: "/skills", file: "skills.png", fullPage: false },
  { path: "/contributors", file: "contributors.png", fullPage: false },
];

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // Retina — README screenshots look crisp
  });
  const page = await context.newPage();

  for (const shot of shots) {
    if (shot.darkMode) {
      // Set localStorage before navigating so the pre-hydration theme script
      // picks it up on first paint.
      await page.addInitScript(() => {
        localStorage.setItem("theme", "dark");
      });
    } else {
      await page.addInitScript(() => {
        localStorage.setItem("theme", "light");
      });
    }

    await page.goto(BASE + shot.path, { waitUntil: "networkidle" });
    // Let fonts and any delayed network settle.
    await page.waitForTimeout(500);

    const dest = path.join(OUT, shot.file);
    await page.screenshot({ path: dest, fullPage: shot.fullPage });
    console.log(`✓ ${shot.file}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
