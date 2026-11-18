import { test, expect } from "../../src/fixtures";
import { config } from "../../src/config/env";

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
});
