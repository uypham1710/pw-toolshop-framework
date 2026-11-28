import { ProductsClient } from "../api/products.client";
import { CategoriesClient } from "../api/categories.client";
import { AuthClient } from "../api/auth.client";
import { test as base, type APIRequestContext } from "@playwright/test";
import { config } from "../config/env";
import { UsersClient } from "../api/users.client";
export { expect } from "@playwright/test";

type ApiFixtures = {
  apiContext: APIRequestContext;
  productsClient: ProductsClient;
  categoriesClient: CategoriesClient;
  authClient: AuthClient;
  usersClient: UsersClient;
};

export const test = base.extend<ApiFixtures>({
  apiContext: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({
      baseURL: config.apiUrl,
      extraHTTPHeaders: {
        Accept: "application/json",
      },
    });
    await use(apiContext);
    await apiContext.dispose();
  },

  productsClient: async ({ apiContext }, use) => {
    await use(new ProductsClient(apiContext));
  },

  categoriesClient: async ({ apiContext }, use) => {
    await use(new CategoriesClient(apiContext));
  },

  authClient: async ({ apiContext }, use) => {
    await use(new AuthClient(apiContext));
  },

  usersClient: async ({ apiContext }, use) => {
    await use(new UsersClient(apiContext));
  },

});