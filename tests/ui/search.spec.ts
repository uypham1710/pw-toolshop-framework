import { test, expect } from "@playwright/test";
import { HomePage } from "../../src/pages/HomePage";

test.describe("Search tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("Search for a product", { tag: ["@smoke"] }, async ({ page }) => {
    const homePage = new HomePage(page);
    const keyword = "hammer";
    const results = homePage.searchResults;

    await test.step("Search for product", async () => {
      await homePage.searchKeyword(keyword);
    });

    await test.step("Verify search results", async () => {
      await expect(results.first()).toBeVisible();
      await expect(results).not.toHaveCount(0);
      await expect(results.filter({ hasNotText: keyword })).toHaveCount(0);
    });
  });

  test("No result search", { tag: ["@regression"] }, async ({ page }) => {
    const homePage = new HomePage(page);
    const searchKey = "abc";
    const product = homePage.productName;
    await expect(product.first()).toBeVisible();

    await test.step("Search for product", async () => {
      await homePage.searchKeyword(searchKey);
    });

    await test.step("Verify no results displayed", async () => {
      await expect(homePage.searchCaption).toHaveText(
        `Searched for: ${searchKey}`,
      );
      await expect(homePage.searchCompletedText).toHaveText(
        "There are no products found.",
      );
    });
  });
});
