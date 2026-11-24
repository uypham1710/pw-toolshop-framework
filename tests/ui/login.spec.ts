import { test, expect } from "../../src/fixtures";

test.describe("Login tests", () => {
  test.beforeEach(async ({ accountPage }) => {
    await accountPage.goto();
  });

  test(
    "Login success",
    { tag: ["@smoke"] },
    async ({ page, accountPage }) => {
      await expect(page).toHaveURL("/account");
      await expect(accountPage.pageTitle).toHaveText("My account");
    },
  );

  test(
    "Username displayed correctly",
    { tag: ["@smoke"] },
    async ({ accountPage, loginPage }) => {
      const username = "Bob Smith";
      await expect(loginPage.emailInput).toBeHidden();
      await expect(accountPage.pageTitle).toHaveText("My account");
      await expect(accountPage.username).toHaveText(username);

    },
  );

});
