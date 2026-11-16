export type Category = "Electronics" | "Clothing" | "Books";

export interface Product {
  readonly id: number;
  name: string;
  price: number;
  description: string;
  inStock: boolean;
  category: Category;
}
