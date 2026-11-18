import { test, expect } from "../../src/fixtures";

test.describe("Home page smoke tests", { tag: ["@smoke"] }, () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test.describe("Home page basic checks", () => {
    test("has title", async ({ page }) => {
      await expect(page).toHaveTitle(/Practice Software Testing/);
    });

    test("should display at least one product card", async ({ homePage }) => {
      await expect(homePage.productNames).not.toHaveCount(0);
    });

    test(
      "Home page shows product grid",
      { tag: ["@smoke"] },
      async ({ homePage }) => {
        await expect(homePage.productCards).toHaveCount(9);
        for (const card of await homePage.productCards.all()) {
          await expect(homePage.productNameIn(card)).toBeVisible();
          await expect(homePage.productPriceIn(card)).toBeVisible();
        }
      },
    );

    test(
      "Pagination goes to next page",
      { tag: ["@regression"] },
      async ({ homePage }) => {
        await expect(homePage.productCards).toHaveCount(9);
        const firstProduct = await homePage.getFirstProductName();
        await homePage.goToNextPage();
        await expect(homePage.firstProductName).not.toHaveText(firstProduct);
        await expect(homePage.productCards).toHaveCount(9);
      },
    );
  });
});
