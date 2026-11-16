import { test, expect } from "@playwright/test";

test("Navigate to login page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/auth/login");
});

test("Fill login form", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email address *", { exact: true }).fill("test@example.com");
    await page.getByLabel("Password *", { exact: true }).fill("123456");
    await expect(page.getByLabel("Email address *", { exact: true })).toHaveValue("test@example.com");
    await expect(page.getByLabel("Password *", { exact: true })).toHaveValue("123456");
});

test("Search for a product", async ({ page }) => {
    const productName = "Combination Pliers";
    const product = page.getByTestId("product-name");
    await page.goto("/");
    await expect(product.first()).toBeVisible();
    await page.getByTestId("search-query").fill(productName);
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByTestId("search-caption")).toHaveText(`Searched for: ${productName}`);
    await expect(product).toHaveCount(1);
    await expect(product).toHaveText(productName);
});