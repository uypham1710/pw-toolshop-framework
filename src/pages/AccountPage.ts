import { type Locator, type Page } from "@playwright/test";

export class AccountPage {
  private readonly page: Page;
  readonly pageTitle: Locator;
  readonly userMenu: Locator;
  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByTestId("page-title");
    this.userMenu = page.getByTestId("nav-menu");
  }
  async goto() {
    await this.page.goto("/account");
  }
}
