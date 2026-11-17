import { type Locator, type Page } from "@playwright/test";

export class AccountPage {
  private readonly page: Page;
  readonly pageTitle: Locator;
  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByTestId("page-title");
  }
}
