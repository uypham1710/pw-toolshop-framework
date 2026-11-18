import { type Locator, type Page } from "@playwright/test";

export type ErrorPosition = "email" | "password" | "form";

export class LoginPage {
  private readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly loginError: Locator;
  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email address/i);
    this.passwordInput = page.getByLabel(/^password/i);
    this.loginButton = page.getByRole("button", { name: /login/i });
    this.emailError = page.getByTestId("email-error");
    this.passwordError = page.getByTestId("password-error");
    this.loginError = page.getByTestId("login-error");
  }

  async goto(): Promise<void> {
    await this.page.goto("/auth/login");
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  errorFor(position: ErrorPosition): Locator {
    const errors: Record<ErrorPosition, Locator> = {
      email: this.emailError,
      password: this.passwordError,
      form: this.loginError,
    };
    return errors[position];
  }
}
