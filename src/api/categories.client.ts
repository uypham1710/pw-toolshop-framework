import type { APIRequestContext, APIResponse } from "@playwright/test";
import { parseJson } from "./http";
import type { CategoryTree } from "./types/product";

export class CategoriesClient {
  constructor(private readonly request: APIRequestContext) {}

  getCategoryTreeRaw(): Promise<APIResponse> {
    return this.request.get("/categories/tree");
  }

  /** Endpoint này trả về mảng trực tiếp, KHÔNG có phân trang */
  async getCategoryTree(): Promise<CategoryTree[]> {
    return parseJson<CategoryTree[]>(await this.getCategoryTreeRaw());
  }
}
