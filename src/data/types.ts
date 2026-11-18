export type Category = "Electronics" | "Clothing" | "Books";

export interface Product {
  readonly id: number;
  name: string;
  price: number;
  description: string;
  inStock: boolean;
  category: Category;
}

export interface RegisterForm {
  firstName: string;
  lastName: string;
  /** Format: YYYY-MM-DD */
  dateOfBirth: string;
  country: string;
  postalCode: string;
  houseNumber: string;
  street: string;
  city: string;
  state: string;
  phone: string;
  emailAddress: string;
  password: string;
}
