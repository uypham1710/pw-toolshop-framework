import { type Locator, type Page } from "@playwright/test";

export class HomePage {
  private readonly page: Page;
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
    this.searchResultsContainer = page.getByTestId("search_completed");
    this.searchResults =
      this.searchResultsContainer.getByTestId("product-name");
    this.productNames = page.getByTestId("product-name");
    this.searchCaption = page.getByTestId("search-caption");
    this.signInLink = page.getByRole("link", { name: "Sign in" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
    await this.productNames.first().waitFor();
  }

  async searchKeyword(keyword: string): Promise<void> {
    await this.searchBox.fill(keyword);
    await this.searchButton.click();
  }
}
