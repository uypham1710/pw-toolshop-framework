/**
 * Assertion function: throws if value is null/undefined.
 * After calling it, TypeScript narrows `value` to NonNullable<T>.
 */
export function assertDefined<T>(
  value: T,
  message = "Expected value to be defined",
): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
}
