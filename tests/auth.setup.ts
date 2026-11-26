import { test as setup, expect } from "../src/fixtures";
import { config, AUTH_FILE } from "../src/config/env";

setup("Authentication setup", async ({ accountPage, loginPage, page }) => {
  await loginPage.goto();
  await loginPage.login(config.customer.email, config.customer.password);
  await expect(page).toHaveURL("/account");
  await expect(accountPage.pageTitle).toHaveText("My account");
  await page.context().storageState({ path: AUTH_FILE });
});
