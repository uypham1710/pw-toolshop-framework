import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Practice Software Testing/);
});

test("should display at least one product card", async ({ page }) => {
  await page.goto("/");

  const productCards = page
    .getByRole("link")
    .filter({ has: page.getByRole("heading", { level: 5 }) });

  await expect(productCards).not.toHaveCount(0);
});

test("Sign in link exists", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});
