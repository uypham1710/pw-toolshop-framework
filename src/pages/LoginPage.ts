import { type Locator, type Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailTextBox: Locator;
  readonly passwordTextbox: Locator;
  readonly loginButton: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  constructor(page: Page) {
    this.page = page;
    this.emailTextBox = page.getByLabel(/email address/i);
    this.passwordTextbox = page.getByLabel(/^password/i);
    this.loginButton = page.getByRole("button", { name: /login/i });
    this.emailError = page.getByTestId("email-error");
    this.passwordError = page.getByTestId("password-error");
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailTextBox.fill(email);
    await this.passwordTextbox.fill(password);
    await this.loginButton.click();
  }
}
