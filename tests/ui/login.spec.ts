import { test, expect } from "../../src/fixtures";
import { config } from "../../src/config/env";

test.describe("Login tests", () => {
  test.beforeEach(async ({ accountPage }) => {
    await accountPage.goto();
  });

  test("Login success", { tag: ["@smoke"] }, async ({ page, accountPage }) => {
    await expect(page).toHaveURL("/account");
    await expect(accountPage.pageTitle).toHaveText("My account");
  });

  test(
    "Username displayed correctly",
    { tag: ["@smoke"] },
    async ({ accountPage, loginPage }) => {
      await expect(loginPage.emailInput).toBeHidden();
      await expect(accountPage.pageTitle).toHaveText("My account");
      await expect(accountPage.userMenu).toHaveText(config.customer.name);
    },
  );
});
