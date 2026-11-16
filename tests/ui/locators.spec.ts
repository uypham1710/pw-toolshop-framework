import { test, expect } from "@playwright/test";

test("Navigate to login page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/auth/login");
});

test("Fill login form", async ({ page }) => {
  const email = page.getByLabel(/email address/i);
  const password = page.getByLabel(/^password/i);
  await page.goto("/auth/login");
  await email.fill("test@example.com");
  await password.fill("123456");
  await expect(email).toHaveValue("test@example.com");
  await expect(password).toHaveValue("123456");
});

test("Search for a product", async ({ page }) => {
  const productName = "Combination Pliers";
  const product = page.getByTestId("product-name");
  await page.goto("/");
  await expect(product.first()).toBeVisible();
  await page.getByRole("textbox", { name: /search/i }).fill(productName);
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByTestId("search-caption")).toHaveText(
    `Searched for: ${productName}`,
  );
  await expect(product).toHaveCount(1);
  await expect(product).toHaveText(productName);
});
