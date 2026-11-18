import { test, expect } from "../../src/fixtures";
import { productNames } from "../../src/data/product.data";
import { escapeRegExp } from "../../src/utils/regex";

test.describe("Product detail page smoke tests", { tag: ["@smoke"] }, () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test(
    "Open product detail from home",
    { tag: ["@smoke"] },
    async ({ page, homePage, productPage }) => {
      const name = productNames.combinationPliers;
      const card = homePage.productCardByName(name);

      await expect(card).toHaveCount(1);

      const href = await homePage.getProductHref(card);
      const cardPrice = (await homePage.productPriceIn(card).innerText())
        .replace("$", "")
        .trim();

      await card.click();

      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(href)}$`));
      await expect(productPage.productName).toHaveText(name);
      await expect(productPage.unitPrice).toContainText(cardPrice);
    },
  );

  test(
    "Add product to cart",
    { tag: ["@regression"] },
    async ({ homePage, productPage }) => {
      const name = productNames.combinationPliers;
      const quantity = 2;
      await homePage.openProduct(name);
      await expect(productPage.productName).toHaveText(name);

      await productPage.setQuantity(quantity);
      await productPage.addToCart();
      await expect(productPage.toastMessage).toHaveText(
        "Product added to shopping cart.",
      );
      await expect(productPage.cartQuantity).toHaveText(String(quantity));
    },
  );
});
