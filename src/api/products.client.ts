import type { APIRequestContext, APIResponse } from "@playwright/test";
import { parseJson } from "./http";
import type { Paginated } from "./types/common";
import type { Product } from "./types/product";

export class ProductsClient {
  constructor(private readonly request: APIRequestContext) {}

  // ---------- Raw: dùng cho negative test / assert status ----------

  getProductsRaw(page = 1): Promise<APIResponse> {
    return this.request.get("/products", { params: { page } });
  }

  getProductByIdRaw(id: string): Promise<APIResponse> {
    return this.request.get(`/products/${id}`);
  }

  // ---------- Typed: dùng cho happy path ----------

  async getProducts(page = 1): Promise<Paginated<Product>> {
    return parseJson<Paginated<Product>>(await this.getProductsRaw(page));
  }

  async getProductById(id: string): Promise<Product> {
    return parseJson<Product>(await this.getProductByIdRaw(id));
  }
}
