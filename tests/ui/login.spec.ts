import { test, expect } from "../../src/fixtures";
import { config } from "../../src/config/env";
import { unregisteredUser, invalidEmail } from "../../src/data/users";

test.describe("Login tests", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test(
    "Login success",
    { tag: ["@smoke"] },
    async ({ loginPage, page, accountPage }) => {
      await loginPage.login(config.customer.email, config.customer.password);
      await expect(page).toHaveURL("/account");
      await expect(accountPage.pageTitle).toHaveText("My account");
    },
  );

  test(
    "Invalid password",
    { tag: ["@regression"] },
    async ({ loginPage, page }) => {
      await loginPage.login(unregisteredUser.email, unregisteredUser.password);
      await expect(loginPage.loginError).toHaveText(
        /invalid email or password/i,
      );
      await expect(page).not.toHaveURL("/account");
    },
  );

  test("Invalid email", { tag: ["@regression"] }, async ({ loginPage }) => {
    await loginPage.login(invalidEmail.email, invalidEmail.password);
    await expect(loginPage.emailError).toHaveText(/email format is invalid/i);
  });

  test(
    "Empty email and password",
    { tag: ["@regression"] },
    async ({ loginPage }) => {
      await loginPage.login("", "");
      await expect.soft(loginPage.emailError).toHaveText(/email is required/i);
      await expect
        .soft(loginPage.passwordError)
        .toHaveText(/password is required/i);
    },
  );
});
