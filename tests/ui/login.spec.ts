import { test, expect } from "@playwright/test";
import { testUser } from "../../src/data/users";

test("Login success", async ({ page }) => {
  const email = page.getByLabel(/email address/i);
  const password = page.getByLabel(/^password/i);
  await page.goto("/auth/login");
  await email.fill(testUser.email);
  await password.fill(testUser.password);
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page).toHaveURL("/account");
  await expect(page.getByTestId("page-title")).toHaveText("My account");
});

test("Invalid password", async ({ page }) => {
  const email = page.getByLabel(/email address/i);
  const password = page.getByLabel(/^password/i);
  await page.goto("/auth/login");
  await email.fill("test@example.com");
  await password.fill("123456");
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page.getByTestId("login-error")).toHaveText(
    /invalid email or password/i,
  );
  await expect(page).not.toHaveURL("/account");
});

test("Invalid email", async ({ page }) => {
  const email = page.getByLabel(/email address/i);
  await page.goto("/auth/login");
  await email.fill("abc.com");
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page.getByTestId("email-error")).toHaveText(
    /email format is invalid/i,
  );
});

test("Empty email and password", async ({ page }) => {
  const email = page.getByLabel(/email address/i);
  const password = page.getByLabel(/^password/i);
  await page.goto("/auth/login");
  await email.fill("");
  await password.fill("");
  await page.getByRole("button", { name: /login/i }).click();
  await expect
    .soft(page.getByTestId("email-error"))
    .toHaveText(/email is required/i);
  await expect
    .soft(page.getByTestId("password-error"))
    .toHaveText(/password is required/i);
});
