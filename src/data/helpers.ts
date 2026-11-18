import { randomUUID } from "node:crypto";

export function uniqueEmail(prefix = "user"): string {
  return `${prefix}_${randomUUID()}@example.com`;
}
