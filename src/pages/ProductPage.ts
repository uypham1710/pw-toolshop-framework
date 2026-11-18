import { type Locator, type Page } from "@playwright/test";

export class ProductPage {
  readonly productName: Locator;
  readonly unitPrice: Locator;
  readonly quantityInput: Locator;
  readonly addToCartButton: Locator;
  readonly cartConfirmationMessage: Locator;
  readonly cartQuantity: Locator;
  readonly toastMessage: Locator;
  constructor(page: Page) {
    this.productName = page.getByTestId("product-name");
    this.unitPrice = page.getByTestId("unit-price");
    this.quantityInput = page.getByTestId("quantity");
    this.addToCartButton = page.getByRole("button", { name: /add to cart/i });
    this.cartConfirmationMessage = page.getByTestId(
      "cart-confirmation-message",
    );
    this.cartQuantity = page.getByTestId("cart-quantity");
    this.toastMessage = page.getByRole("alert");
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }

  async setQuantity(quantity: number): Promise<void> {
    await this.quantityInput.fill(quantity.toString());
  }

  async getCartQuantity(): Promise<number> {
    const quantityText = await this.cartQuantity.innerText();
    return parseInt(quantityText, 10);
  }
}
