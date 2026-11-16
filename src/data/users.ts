import { requireEnv } from "../config/env";

export interface User {
  email: string;
  password: string;
}

export const testUser: User = {
  email: requireEnv("CUSTOMER_EMAIL"),
  password: requireEnv("CUSTOMER_PASSWORD"),
};
