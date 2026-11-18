import { type Locator, type Page } from "@playwright/test";
import { escapeRegExp } from "../utils/regex";

export class HomePage {
  private readonly page: Page;
  readonly searchBox: Locator;
  readonly searchButton: Locator;
  readonly searchResults: Locator;
  readonly productNames: Locator;
  readonly searchCaption: Locator;
  readonly searchResultsContainer: Locator;
  readonly signInLink: Locator;
  readonly productCards: Locator;
  readonly nextPageButton: Locator;
  readonly firstProductName: Locator;
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
    this.productCards = page
      .getByRole("link")
      .filter({ has: this.productNames });
    this.nextPageButton = page.getByRole("button", { name: "Next" });
    this.firstProductName = this.productNameIn(this.productCards.first());
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
    await this.productNames.first().waitFor();
  }

  async searchKeyword(keyword: string): Promise<void> {
    await this.searchBox.fill(keyword);
    await this.searchButton.click();
  }

  productNameIn(card: Locator): Locator {
    return card.getByTestId("product-name");
  }

  productPriceIn(card: Locator): Locator {
    return card.getByTestId("product-price");
  }

  async getFirstProductName(): Promise<string> {
    return (await this.firstProductName.innerText()).trim();
  }

  async goToNextPage(): Promise<void> {
    await this.nextPageButton.click();
  }

  productCardByName(name: string): Locator {
    const exactName = this.page
      .getByTestId("product-name")
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(name)}\\s*$`) });
    return this.productCards.filter({ has: exactName });
  }

  async getProductHref(card: Locator): Promise<string> {
    const href = await card.getAttribute("href");
    if (!href) {
      throw new Error("Product card has no href attribute");
    }
    return href;
  }

  async openProduct(name: string): Promise<void> {
    await this.productCardByName(name).click();
  }
}
