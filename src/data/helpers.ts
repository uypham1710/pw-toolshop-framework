import { randomUUID } from "node:crypto";

export function uniqueEmail(prefix: string = "user"): string {
  return `${prefix}_${randomUUID()}@example.com`;
}
