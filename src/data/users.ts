export interface User {
  email: string;
  password: string;
}

export const unregisteredUser: User = {
  email: "not-registered@example.com",
  password: "SomePassword123!",
};

export const invalidEmail: User = {
  email: "invalid-email",
  password: "",
};
