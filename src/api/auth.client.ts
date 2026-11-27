import type { APIRequestContext, APIResponse } from "@playwright/test";
import { parseJson } from "./http";
import type { AuthResponse, LoginRequest } from "./types/auth";

export class AuthClient {
  constructor(private readonly request: APIRequestContext) {}

  loginRaw(credentials: LoginRequest): Promise<APIResponse> {
    return this.request.post("/users/login", { data: credentials });
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return parseJson<AuthResponse>(await this.loginRaw(credentials));
  }
}
