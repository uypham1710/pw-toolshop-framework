import type { APIRequestContext, APIResponse } from "@playwright/test";
import { ensureOk, parseJson } from "./http";
import type { CreateUserRequest, CreateUserResponse } from "./types/user";

export class UsersClient {
  constructor(private readonly request: APIRequestContext) {}

  // ---------- Raw: dùng cho negative test / assert status ----------

  registerRaw(payload: CreateUserRequest): Promise<APIResponse> {
    return this.request.post("/users/register", { data: payload });
  }

  deleteUserRaw(userId: string, adminToken: string): Promise<APIResponse> {
    return this.request.delete(`/users/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }

  // ---------- Typed: dùng cho happy path / setup / cleanup ----------

  async register(payload: CreateUserRequest): Promise<CreateUserResponse> {
    return parseJson<CreateUserResponse>(await this.registerRaw(payload));
  }

  /** Cần token admin (lấy qua AuthClient.login). Không parse body vì có thể là 204. */
  async deleteUser(userId: string, adminToken: string): Promise<void> {
    await ensureOk(await this.deleteUserRaw(userId, adminToken));
  }
}
