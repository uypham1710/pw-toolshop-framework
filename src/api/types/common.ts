/**
 * Wrapper phân trang (Laravel paginator) dùng chung cho các endpoint list,
 * ví dụ: GET /products, GET /brands?page=N
 *
 * T = kiểu của từng phần tử trong mảng `data`.
 */
export interface Paginated<T> {
  current_page: number;
  data: T[];
  from: number | null; // null khi trang rỗng (vd: ?page=999), cần verify
  last_page: number;
  per_page: number;
  to: number | null; // null khi trang rỗng, cần verify
  total: number;
}
