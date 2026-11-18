import { uniqueEmail } from "./helpers";
import type { RegisterForm } from "./types";

export function createUser(
  overrides: Partial<RegisterForm> = {},
): RegisterForm {
  const defaults: RegisterForm = {
    firstName: "Test",
    lastName: "User",
    dateOfBirth: "2000-01-01",
    country: "Viet Nam",
    postalCode: "12345",
    houseNumber: "1",
    street: "Test Street",
    city: "Test City",
    state: "Test State",
    phone: "0123456789",
    emailAddress: uniqueEmail(),
    password: "Password123@",
  };

  return { ...defaults, ...overrides };
}
