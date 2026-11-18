import { uniqueEmail } from "./helpers";
import type { ErrorPosition } from "../pages/LoginPage";

export interface LoginCase {
  title: string;
  email: string;
  password: string;
  expectedError: string;
  errorPosition: ErrorPosition;
}

export const loginCases: readonly LoginCase[] = [
  {
    title: "Invalid email format",
    email: "invalidexample.com",
    password: "Password123@",
    expectedError: "Email format is invalid",
    errorPosition: "email",
  },
  {
    title: "Invalid email or password",
    email: uniqueEmail(),
    password: "wrongpassword",
    expectedError: "Invalid email or password",
    errorPosition: "form",
  },
  {
    title: "Empty email",
    email: "",
    password: "Password123@",
    expectedError: "Email is required",
    errorPosition: "email",
  },
  {
    title: "Empty password",
    email: uniqueEmail(),
    password: "",
    expectedError: "Password is required",
    errorPosition: "password",
  },
];
