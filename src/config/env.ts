import "dotenv/config";

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

export interface AppConfig {
  readonly customer: {
    readonly email: string;
    readonly password: string;
  };
  readonly baseUrl: string;
  readonly apiUrl: string;
}

export const config: AppConfig = {
  customer: {
    email: requireEnv("CUSTOMER_EMAIL"),
    password: requireEnv("CUSTOMER_PASSWORD"),
  },
  baseUrl: requireEnv("BASE_URL"),
  apiUrl: requireEnv("API_URL"),
};
