import { test, expect } from "../../src/fixtures";

test.describe("Search tests", () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test("Search for a product", { tag: ["@smoke"] }, async ({ homePage }) => {
    const keyword = "hammer";
    const results = homePage.searchResults;

    await test.step("Search for product", async () => {
      await homePage.searchKeyword(keyword);
    });

    await test.step("Verify search results", async () => {
      await expect(results).not.toHaveCount(0);
      await expect(results.filter({ hasNotText: keyword })).toHaveCount(0);
    });
  });

  test("No result search", { tag: ["@regression"] }, async ({ homePage }) => {
    const searchKey = "abc";

    await test.step("Search for product", async () => {
      await homePage.searchKeyword(searchKey);
    });

    await test.step("Verify no results displayed", async () => {
      await expect(homePage.searchCaption).toHaveText(
        `Searched for: ${searchKey}`,
      );
      await expect(homePage.searchResultsContainer).toHaveText(
        "There are no products found.",
      );
      await expect(homePage.searchResults).toHaveCount(0);
    });
  });
});
