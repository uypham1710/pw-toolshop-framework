import { searchCases, noResultSearchKeyword } from "../../src/data/search.data";
import { test, expect } from "../../src/fixtures";

test.describe("Search tests", { tag: ["@search"] }, () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  for (const { keyword, tags } of searchCases) {
    // eslint-disable-next-line playwright/valid-test-tags -- tags come from typed test data (TestTag), validated by TS
    test(
      `Search for ${keyword}`,
      { tag: tags ?? ["@regression"] },
      async ({ homePage }) => {
        const results = homePage.searchResults;

        await test.step("Search for product", async () => {
          await homePage.searchKeyword(keyword);
        });

        await test.step("Verify search results", async () => {
          await expect(homePage.searchCaption).toHaveText(
            `Searched for: ${keyword}`,
          );
          await expect(results).not.toHaveCount(0);
          await expect(results.filter({ hasNotText: keyword })).toHaveCount(0);
        });
      },
    );
  }

  test("No result search", { tag: ["@regression"] }, async ({ homePage }) => {
    await test.step("Search for product", async () => {
      await homePage.searchKeyword(noResultSearchKeyword);
    });

    await test.step("Verify no results displayed", async () => {
      await expect(homePage.searchCaption).toHaveText(
        `Searched for: ${noResultSearchKeyword}`,
      );
      await expect(homePage.searchResultsContainer).toHaveText(
        "There are no products found.",
      );
      await expect(homePage.searchResults).toHaveCount(0);
    });
  });
});
