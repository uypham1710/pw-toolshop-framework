import type { CreateUserRequest } from "../api/types/user";
import { uniqueEmail } from "./helpers";
import type { RegisterForm } from "./types";

export function createUser(
  overrides: Partial<RegisterForm> = {},
): RegisterForm {
  const defaults: RegisterForm = {
    firstName: "Test",
    lastName: "User",
    dateOfBirth: "2000-01-01",
    country: "VN",
    postalCode: "12345",
    houseNumber: "1",
    street: "Test Street",
    city: "Test City",
    state: "Test State",
    phone: "0123456789",
    emailAddress: uniqueEmail(),
    password: "Playwright123@",
  };

  return { ...defaults, ...overrides };
}

/** Map data dạng UI form (camelCase) sang payload API register (snake_case). */
export function toCreateUserRequest(form: RegisterForm): CreateUserRequest {
  return {
    first_name: form.firstName,
    last_name: form.lastName,
    dob: form.dateOfBirth,
    phone: form.phone,
    email: form.emailAddress,
    password: form.password,
    address: {
      street: form.street,
      house_number: form.houseNumber,
      city: form.city,
      state: form.state,
      country: form.country,
      postal_code: form.postalCode,
    },
  };
}