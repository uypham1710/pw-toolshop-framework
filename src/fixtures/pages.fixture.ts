import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { HomePage } from "../pages/HomePage";
import { AccountPage } from "../pages/AccountPage";
import { ProductPage } from "../pages/ProductPage";
export { expect } from "@playwright/test";

type PageFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  accountPage: AccountPage;
  productPage: ProductPage;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },
  accountPage: async ({ page }, use) => {
    const accountPage = new AccountPage(page);
    await use(accountPage);
  },
  productPage: async ({ page }, use) => {
    const productPage = new ProductPage(page);
    await use(productPage);
  },
});
