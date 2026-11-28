import { test, expect } from "../../src/fixtures";
import { assertDefined } from "../../src/utils/assert";

const NON_EXISTENT_PRODUCT_ID = "00000000000000000000000000";

test.describe("Products API", { tag: ["@api", "@smoke"] }, () => {
  test("GET /products returns the first page of products", async ({
    productsClient,
  }) => {
    const body = await productsClient.getProducts();

    expect(body.current_page).toBe(1);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.length).toBeLessThanOrEqual(body.per_page);
  });

  test("GET /products/{id} returns the same product as in the list", async ({
    productsClient,
  }) => {
    const list = await productsClient.getProducts();
    const firstProduct = list.data[0];
    assertDefined(firstProduct, "Product list should not be empty");

    const detail = await productsClient.getProductById(firstProduct.id);

    expect(detail).toMatchObject({
      id: firstProduct.id,
      name: firstProduct.name,
      price: firstProduct.price,
    });
  });

  test("GET /products/{id} returns 404 for a non-existent id", async ({
    productsClient,
  }) => {
    const response = await productsClient.getProductByIdRaw(
      NON_EXISTENT_PRODUCT_ID,
    );

    expect(response.status()).toBe(404);
  });
});

test.describe("Auth API", { tag: ["@api"] }, () => {
  test("POST /users/login returns 401 for invalid credentials", async ({
    authClient,
  }) => {
    const response = await authClient.loginRaw({
      email: "invalid@example.com",
      password: "wrongpassword",
    });

    expect(response.status()).toBe(401);
  });
});
