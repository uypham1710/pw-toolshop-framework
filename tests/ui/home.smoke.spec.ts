import { test, expect } from "../../src/fixtures";

test.describe("Home page smoke tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has title", async ({ page }) => {
    await expect(page).toHaveTitle(/Practice Software Testing/);
  });

  test("should display at least one product card", async ({ homePage }) => {
    await expect(homePage.productNames).not.toHaveCount(0);
  });

  test("Sign in link exists", async ({ homePage }) => {
    await expect(homePage.signInLink).toBeVisible();
  });
});
