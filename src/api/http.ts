import type { APIResponse } from "@playwright/test";

export async function ensureOk(response: APIResponse): Promise<void> {
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `Request failed: ${response.url()} → ${response.status()} ${response.statusText()}\n` +
        `Body: ${body.slice(0, 500)}`,
    );
  }
}

export async function parseJson<T>(response: APIResponse): Promise<T> {
  await ensureOk(response);
  return (await response.json()) as T;
}
