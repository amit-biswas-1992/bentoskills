import { test, expect } from "@playwright/test";

test("homepage renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("UI/UX skills for Claude Code.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("browse page renders", async ({ page }) => {
  await page.goto("/skills");
  await expect(page.getByText(/skills$/i).first()).toBeVisible();
});
