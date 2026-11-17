import { type Locator, type Page } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly searchBox: Locator;
  readonly searchButton: Locator;
  readonly searchResults: Locator;
  readonly productNames: Locator;
  readonly searchCaption: Locator;
  readonly searchResultsContainer: Locator;
  readonly signInLink: Locator;
  constructor(page: Page) {
    this.page = page;
    this.searchBox = page.getByRole("textbox", { name: /search/i });
    this.searchButton = page.getByRole("button", { name: "Search" });
    this.searchResults = page
      .getByTestId("search_completed")
      .getByTestId("product-name");
    this.productNames = page.getByTestId("product-name");
    this.searchCaption = page.getByTestId("search-caption");
    this.searchResultsContainer = page.getByTestId("search_completed");
    this.signInLink = page.getByRole("link", { name: "Sign in" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  async searchKeyword(keyword: string): Promise<void> {
    await this.searchBox.fill(keyword);
    await this.searchButton.click();
  }
}
