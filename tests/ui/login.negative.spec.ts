import { loginCases } from "../../src/data/login.data";
import { test, expect } from "../../src/fixtures";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login Negative Cases", { tag: ["@negative"] }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  for (const loginCase of loginCases) {
    test(`login fail: ${loginCase.title}`, async ({ loginPage }) => {
      await loginPage.login(loginCase.email, loginCase.password);
      await expect(loginPage.errorFor(loginCase.errorPosition)).toHaveText(
        loginCase.expectedError,
      );
    });
  }
});
