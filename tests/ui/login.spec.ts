import { testUser } from "../../src/data/users";
import { test, expect } from "../../src/fixtures";

test.describe("Login tests", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test(
    "Login success",
    { tag: ["@smoke"] },
    async ({ loginPage, page, accountPage }) => {
      await loginPage.login(testUser.email, testUser.password);
      await expect(page).toHaveURL("/account");
      await expect(accountPage.pageTitle).toHaveText("My account");
    },
  );

  test(
    "Invalid password",
    { tag: ["@regression"] },
    async ({ loginPage, page }) => {
      await loginPage.login("test@example.com", "123456");
      await expect(loginPage.loginError).toHaveText(
        /invalid email or password/i,
      );
      await expect(page).not.toHaveURL("/account");
    },
  );

  test("Invalid email", { tag: ["@regression"] }, async ({ loginPage }) => {
    await loginPage.login("abc.com", "");
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
