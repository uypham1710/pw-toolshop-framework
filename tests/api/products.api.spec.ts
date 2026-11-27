import { test, expect } from "../../src/fixtures";
import { assertDefined } from "../../src/utils/assert";


const NON_EXISTENT_PRODUCT_ID = "00000000000000000000000000";

test.describe("API test", { tag: ["@smoke"] }, () => {
  test.describe("Product list", () => {
    test("Get product list", async ({ productsClient }) => {
      const response = await productsClient.getProductsRaw();
      await expect(response).toBeOK();
      const body = await productsClient.getProducts();
      expect(body.current_page).toBe(1);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    test("Get product by product id", async ({ productsClient }) => {
      const listReponse = await productsClient.getProductsRaw();
      await expect(listReponse).toBeOK();
      const list = await productsClient.getProducts();
      expect(list.data.length).toBeGreaterThan(0);
      const firstProduct = list.data[0];
      assertDefined(firstProduct, "First product should be defined");
      const detailResponse = await productsClient.getProductByIdRaw(firstProduct.id);
      await expect(detailResponse).toBeOK();
      const detail = (await productsClient.getProductById(firstProduct.id));
      expect(detail).toMatchObject({
        id: firstProduct.id,
        name: firstProduct.name,
        price: firstProduct.price,
      });
    });

    test("GET /products/{id} returns 404 for a non-existent id", async ({
      productsClient,
    }) => {
      const detailResponse = await productsClient.getProductByIdRaw(
        NON_EXISTENT_PRODUCT_ID,
      );
      expect(detailResponse.status()).toBe(404);
    });
  });

  test.describe("User API", () => {
    test("POST /users/login rejects invalid credentials", async ({
      authClient,
    }) => {
      const response = await authClient.loginRaw({ 
        email: "invalid@example.com",
        password: "wrongpassword"
      });
      expect(response.status()).toBe(401);
    });
  });
});
