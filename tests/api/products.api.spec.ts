import { test, expect } from "../../src/fixtures";
import { assertDefined } from "../../src/utils/assert";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface ProductListResponse {
  current_page: number;
  data: Product[];
  last_page: number;
  per_page: number;
  total: number;
}

const NON_EXISTENT_PRODUCT_ID = '00000000000000000000000000';

test.describe("API test", { tag: ["@smoke"] }, () => {

  test.describe("Product list", () => {
    test("Get product list", async ({ request }) => {
      const response = await request.get("/products");
      await expect(response).toBeOK();
      const body = (await response.json()) as ProductListResponse;
      expect(body.current_page).toBe(1);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });


    test("Get product by product id", async ({ request }) => {
      const listReponse = await request.get("/products");
      await expect(listReponse).toBeOK();
      const list = (await listReponse.json()) as ProductListResponse;
      expect(list.data.length).toBeGreaterThan(0);
      const firstProduct = list.data[0];
      assertDefined(firstProduct, 'First product should be defined');
      const detailResponse = await request.get(`/products/${firstProduct.id}`);
      await expect(detailResponse).toBeOK();
      const detail = (await detailResponse.json()) as Product;
      expect(detail).toMatchObject(
        {
          id: firstProduct.id,
          name: firstProduct.name,
          price: firstProduct.price
        }
      )
    });

    test("GET /products/{id} returns 404 for a non-existent id", async ({ request }) => {
      const detailResponse = await request.get(`/products/${NON_EXISTENT_PRODUCT_ID}`);
      expect(detailResponse.status()).toBe(404);  
    });

  });

  test.describe("User API", () => {
    test("POST /users/login rejects invalid credentials", async ({ request }) => {
      const response = await request.post("/users/login", {
        data: {
          email: "invalid@example.com",
          password: "wrongpassword"
        }
      });
      expect(response.status()).toBe(401);
    });
  });
});
