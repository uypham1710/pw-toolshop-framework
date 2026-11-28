import { test, expect } from "../../src/fixtures";

test.describe(
  "User hybrid: API setup → UI verify → API cleanup",
  { tag: ["@e2e"] },
  () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("new user created via API can log in via UI", async ({
      newUser,
      loginPage,
      accountPage,
      page,
    }) => {
      await test.step("Login via UI with API-created user", async () => {
        await loginPage.goto();
        await loginPage.login(newUser.emailAddress, newUser.password);
        await expect(page).toHaveURL(/\/account/);
      });

      await test.step("Verify account page shows the new user", async () => {
        await expect(page).toHaveURL(/\/account/);
        await expect(accountPage.pageTitle).toHaveText("My account");
        await expect(accountPage.userMenu).toHaveText(
          `${newUser.firstName} ${newUser.lastName}`,
        );
      });
    });
  },
);
