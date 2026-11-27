import type { APIResponse } from "@playwright/test";

export async function parseJson<T>(response: APIResponse): Promise<T> {
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Request failed: ${response.url()} → ${response.status()} ${response.statusText()}\n` +
        `Body: ${body.slice(0, 500)}`,
    );
  }
  return (await response.json()) as T;
}
