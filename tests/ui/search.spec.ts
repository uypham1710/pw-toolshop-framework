import { test, expect } from "@playwright/test";

test.describe("Search tests", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
    });

    test("Search for a product", { tag: ["@smoke"] }, async ({ page }) => {
        const keyword = "hammer";
        const results = page.getByTestId("search_completed").getByTestId("product-name");

        await test.step("Search for product", async () => {
            await page.getByRole("textbox", { name: /search/i }).fill(keyword);
            await page.getByRole("button", { name: "Search" }).click();
        });

        await test.step("Verify search results", async () => {
            await expect(results.first()).toBeVisible();
            await expect(results).not.toHaveCount(0);
            await expect(results.filter({ hasNotText: keyword })).toHaveCount(0);
        });
    });

    test("No result search", { tag: ["@regression"] }, async ({ page }) => {
        const searchKey = "abc";
        const product = page.getByTestId("product-name");
        await expect(product.first()).toBeVisible();

        await test.step("Search for product", async () => {
            await page.getByRole("textbox", { name: /search/i }).fill(searchKey);
            await page.getByRole("button", { name: "Search" }).click();
        });

        await test.step("Verify no results displayed", async () => {
            await expect(page.getByTestId("search-caption")).toHaveText(
                `Searched for: ${searchKey}`,
            );
            await expect(page.getByTestId("search_completed")).toHaveText(
                "There are no products found.",
            );
        });
    });
});
