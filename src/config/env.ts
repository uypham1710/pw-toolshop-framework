    /**
 * Read a required environment variable.
 * Throws a clear error if it's missing or empty (fail fast).
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Copy .env.example to .env and fill in the value.`,
    );
  }
  return value;
}