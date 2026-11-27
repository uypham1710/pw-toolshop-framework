# Review day12 — `request` fixture / `APIRequestContext` (Toolshop API)

- Commit: `a1b42af day12: add API project and products/login API tests`
- Mục tiêu roadmap D12: dùng `request` fixture / `APIRequestContext`, gọi API Toolshop (Swagger).

## Kiểm tra tự động

| Lệnh                                  | Kết quả                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| `npx tsc --noEmit`                    | ✅ pass (0 error)                                                               |
| `npx eslint .`                        | ✅ pass (0 warning)                                                             |
| `npx playwright test --reporter=list` | ✅ 21/21 passed (12.0s, 6 workers). 4 test `[api]` chạy song song với `[setup]` |
| `npx prettier --check` (thêm)         | ⚠️ `tests/api/products.api.spec.ts`, `src/utils/assert.ts` chưa format          |

→ Mục tiêu D12 **đạt**: có project `api` riêng, dùng built-in `request` fixture với `baseURL` + `extraHTTPHeaders` lấy từ config, và có cả test happy path lẫn negative.

## Issues

### [Medium] tests/api/products.api.spec.ts:58-69 — Commit nói "login API tests" nhưng chỉ có case login **sai**

- **Vấn đề:** Chưa có test `POST /users/login` thành công (status 200 + body có `access_token`).
- **Vì sao:** Đây là API quan trọng nhất của tuần 3. D13 (API client có types) và D14 (hybrid: tạo data bằng API rồi verify bằng UI) đều cần lấy token qua API. Mới test 401 thì chưa biết token trông thế nào, kiểu gì.
- **Hint:** Login bằng `config.customer`, check `toBeOK()`, rồi assert shape của body (`access_token` là string, `token_type`, `expires_in`). Viết thêm `interface LoginResponse`. Xem Swagger của Toolshop ở `/api/documentation`.

### [Medium] tests/api/products.api.spec.ts:26,36,45 — `as ProductListResponse` không kiểm tra gì lúc runtime

- **Vấn đề:** `(await response.json()) as X` là type assertion. Nó chỉ "hứa" với compiler, giống `typing.cast()` trong Python: không validate gì cả. Nếu API đổi `price` thành string, TS vẫn im lặng.
- **Vì sao:** Với API test, **đúng shape** của response chính là thứ cần test. Line 28 (`Array.isArray`) có check một phần, nhưng các field còn lại (`id`, `name`, `price`, `total`...) thì không.
- **Hint:** Dùng asymmetric matcher của `expect`: `toMatchObject` kết hợp `expect.any(String)` / `expect.any(Number)` / `expect.any(Array)` để assert shape bằng một câu. Sau này có thể tìm hiểu thêm từ khoá "zod schema validation playwright" (optional).
  Docs: https://playwright.dev/docs/api/class-genericassertions#generic-assertions-any

### [Low] playwright.config.ts:2,21,46 — Import `config` hai lần dưới hai tên

- **Vấn đề:** `import { AUTH_FILE, config, config as envConfig }`. Line 21 dùng `envConfig.baseUrl`, line 46 lại dùng `config.apiUrl`.
- **Vì sao:** Cùng một object mà có 2 tên thì người đọc sẽ tưởng là 2 config khác nhau. ESLint không bắt lỗi này.
- **Hint:** Giữ một tên thôi rồi dùng thống nhất.

### [Low] tests/api/products.api.spec.ts:37-39 — Check "list không rỗng" bị lặp

- **Vấn đề:** Có `expect(list.data.length).toBeGreaterThan(0)` rồi lại có thêm `assertDefined(firstProduct)`.
- **Vì sao:** `noUncheckedIndexedAccess: true` (trong tsconfig) làm `list.data[0]` có type `Product | undefined`, nên `assertDefined` là cần (để narrow type). Lúc đó dòng `expect(...length)` thành thừa.
- **Hint:** Chọn một trong hai. Lưu ý `expect(x).toBeDefined()` **không** narrow type cho TS, đó là lý do assertion function của bạn có ích.

### [Low] tests/api/products.api.spec.ts — Cấu trúc file / naming

- `products.api.spec.ts` chứa cả `describe("User API")`. Nên tách ra `users.api.spec.ts` (đến D15 suite API sẽ to dần).
- `describe("API test")` thừa, vì project `api` + thư mục `tests/api` đã nói lên điều đó rồi.
- `interface Product` / `ProductListResponse` nằm trong file test. Để đây cho D12 thì OK, nhưng D13 sẽ chuyển sang `src/api/types`.
- Tên test không cùng một kiểu: `"Get product list"` vs `"GET /products/{id} returns 404..."`. Chọn một convention (gợi ý: `METHOD /path — expectation`).
- Typo `listReponse`. Line 54 có trailing space. Chạy `npm run format` (Prettier đang báo 2 file).

### [Low] tests/api/products.api.spec.ts:20 — Tag `@smoke` cho cả negative case

- 404 và 401 là negative test. Bên UI bạn đã dùng `@negative` (login.negative.spec.ts), nên giữ cùng quy ước: tag ở từng test thay vì gắn `@smoke` cho cả describe.

### [Low] tests/api/products.api.spec.ts:65 — Chỉ assert status cho 401

- Assert status là đúng. Có thể thêm assert body (`error` message) để chắc chắn 401 là do sai credential chứ không phải lỗi gì khác.

### [Low] docs/daily-log.md / commit hygiene

- `###Day12` thiếu dấu cách nên không render thành heading (heading chuẩn vẫn là `## 2026-11-26`, cái này OK).
- Câu trả lời cho câu hỏi day11 mới có nửa đầu ("localStorage"), còn thiếu phần 4 workers / account riêng mỗi worker.
- Commit day12 kèm theo thay đổi format của `reviews/day10.md` và `reviews/day11.md`. Nên tách thành commit riêng (vd `chore: prettier`) để diff của ngày học sạch.

## Thói quen Selenium/Python cần để ý

- **`Array.isArray(...)).toBe(true)`** ≈ `assert isinstance(x, list)` kiểu pytest: check từng field bằng một `assert`. Trong Playwright/Jest-style, bạn mô tả **shape mong đợi** một lần bằng `toMatchObject` + `expect.any(...)`, và khi fail thì diff hiện rõ hơn nhiều.
- **Cast thay cho validate**: thói quen Python "đọc JSON ra dict rồi dùng luôn". Trong TS, `as` cho bạn autocomplete nhưng **không** cho bạn an toàn lúc runtime.

## Làm tốt

1. **Project `api` tách biệt đúng cách**: có `testMatch`/`testIgnore` giữa `chromium` và `api`, project `api` **không** phụ thuộc `setup` và không dùng `storageState`. Nhờ vậy API test chạy ngay, song song với login setup (thấy rõ trong output: `[api]` xong trước `[setup]`).
2. **Dùng built-in `request` fixture + `baseURL`/`extraHTTPHeaders` ở cấp project**, không tự `request.newContext()` trong test, không hardcode URL (lấy từ `API_URL` qua `requireEnv`, đã có trong `.env.example`). Có dùng `await expect(response).toBeOK()`, là matcher dành riêng cho API response.
3. **`assertDefined` với `asserts value is NonNullable<T>`**: hiểu đúng rằng `noUncheckedIndexedAccess` làm `arr[0]` thành `T | undefined`, và dùng assertion function để narrow type thay cho `!` (non-null assertion). Đây là TS "đúng bài".

## Score

| Tiêu chí                                      | Điểm       | Ghi chú                                                                          |
| --------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| Correctness (3)                               | 2.5        | Pass hết, đạt mục tiêu D12; thiếu login happy path                               |
| Locator & waiting (3) → _async/await với API_ | 3          | Mọi call đều `await`, dùng `toBeOK()`, không có wait thừa                        |
| Structure/POM (2)                             | 1.5        | Project config tốt; types và User API nằm lẫn trong products spec                |
| Readability & TS quality (2)                  | 1.5        | `assertDefined` tốt; import trùng, cast không validate, chưa chạy Prettier, typo |
| **Tổng**                                      | **8.5/10** |                                                                                  |

**Kết luận: PASS** (≥ 7, không có issue High). 0 High · 2 Medium · 6 Low.

## Câu hỏi kiểm tra hiểu bài

Built-in fixture `request` khác `page.request` và `playwright.request.newContext()` ở điểm nào? Cụ thể: nếu trong project `chromium` (có `storageState: AUTH_FILE`) bạn gọi `page.request.get("/users/me")` thì request đó **có** gửi kèm token login không? Liên hệ với câu trả lời day11 (Toolshop lưu token ở `localStorage`) để giải thích, và cho biết ở D14 (hybrid) bạn sẽ lấy token cho API call bằng cách nào.
page.request dùng chung cookie với browser. Hai cách còn lại thì không.
nếu trong project `chromium` (có `storageState: AUTH_FILE`) bạn gọi `page.request.get("/users/me")` thì request đó không gửi kèm token của login, vì chỉ lấy được cookies
Gọi POST /users/login qua API, nhận về access_token.
Mỗi API call sau đó gắn header Authorization: Bearer <access_token>. Có thể gắn riêng cho từng call, hoặc gắn một lần qua extraHTTPHeaders khi tạo context.
