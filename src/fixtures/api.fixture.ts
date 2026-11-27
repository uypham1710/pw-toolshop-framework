import { ProductsClient } from "../api/products.client";
import { CategoriesClient } from "../api/categories.client";
import { AuthClient } from "../api/auth.client";
import { test as base, type APIRequestContext } from "@playwright/test";
import { config } from "../config/env";
export { expect } from "@playwright/test";

type ApiFixtures = {
  apiContext: APIRequestContext;
  productsClient: ProductsClient;
  categoriesClient: CategoriesClient;
  authClient: AuthClient;
};

export const test = base.extend<ApiFixtures>({
  apiContext: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({
      baseURL: config.apiUrl,
    });
    await use(apiContext);
    await apiContext.dispose();
  },

  productsClient: async ({ apiContext }, use) => {
    const productsClient = new ProductsClient(apiContext);
    await use(productsClient);
  },

  categoriesClient: async ({ apiContext }, use) => {
    const categoriesClient = new CategoriesClient(apiContext);
    await use(categoriesClient);
  },

  authClient: async ({ apiContext }, use) => {
    const authClient = new AuthClient(apiContext);
    await use(authClient);
  },
});
