export type Co2Rating = "A" | "B" | "C" | "D" | "E";

export interface ProductImage {
  id: string;
  by_name: string;
  by_url: string;
  source_name: string;
  source_url: string;
  file_name: string;
  title: string;
}

export interface Brand {
  id: string;
  name: string;
}

/** Category nhúng trong Product (GET /products, GET /products/{id}) */
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

/** Node trong GET /categories/tree */
export interface CategoryTree extends ProductCategory {
  parent_id: string | null;
  sub_categories: CategoryTree[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  is_location_offer: boolean;
  is_rental: boolean;
  co2_rating: Co2Rating;
  in_stock: boolean;
  is_eco_friendly: boolean;
  product_image: ProductImage;
  category: ProductCategory;
  brand: Brand;
}
