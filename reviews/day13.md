# Review day13 — API client layer có types

**Mục tiêu roadmap (D13):** API client layer có types (interface cho request/response).
**Phạm vi:** chưa commit → review `git diff` + file mới `src/api/**`, `src/fixtures/api.fixture.ts`, `src/fixtures/index.ts`, `tests/api/products.api.spec.ts`.

## Kiểm tra tự động

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ pass |
| `npx eslint .` | ✅ pass |
| `npx playwright test --reporter=list` | ❌ **19 passed, 2 failed** (lần 1) |
| `npx prettier --check` (thêm) | ⚠️ `src/fixtures/index.ts`, `tests/api/products.api.spec.ts` chưa format |

- Project `api` (phần code hôm nay): **4/4 pass**, chạy lại cũng pass.
- Lỗi nằm ở UI (`home.spec.ts`, `search.spec.ts`): `page.goto: Test timeout ... waiting until "load"` / `net::ERR_ABORTED`. Chạy lại thì **test fail mỗi lần một khác** (có lần fail cả `auth.setup.ts`) → flaky do mạng/site live, không phải do diff hôm nay (các file UI không đổi).

## Issues

**[High] tests/ui/home.spec.ts, tests/ui/search.spec.ts (qua `src/pages/HomePage.ts:38`) — full suite fail**
- Vấn đề: theo rule review, lệnh `playwright test` fail là High. Nguyên nhân: `page.goto("/")` chờ event `load` trên site live, đôi lúc quá 30s.
- Vì sao: CI cũng sẽ đỏ ngẫu nhiên → mất tin tưởng vào suite. Đây không phải lỗi do code day13 nhưng vẫn chặn PASS.
- Hint: mở trace/`error-context.md` để xem request nào treo (thường là ảnh/3rd-party script làm `load` chậm). Tra option `waitUntil` của `page.goto` (`"domcontentloaded"` vs `"load"`) — bạn đã chờ `productNames` rồi nên có thể không cần chờ `load`. Cân nhắc `navigationTimeout` trong `use` của config. Docs: https://playwright.dev/docs/api/class-page#page-goto

**[Medium] src/fixtures/api.fixture.ts:16-22 — tự tạo `apiContext` bằng `playwright.request.newContext({ baseURL })` thay vì dùng fixture `request` có sẵn**
- Vấn đề: context tự tạo **không kế thừa `use` của project `api`** → mất `extraHTTPHeaders: { Accept: "application/json" }` bạn đã khai báo trong config. `baseURL` cũng bị khai báo 2 nơi (config + fixture).
- Vì sao: Toolshop là Laravel — khi thiếu `Accept: application/json`, lỗi validation (422) / auth có thể trả HTML hoặc redirect thay vì JSON. Test hiện tại chưa đụng tới nên vẫn xanh, nhưng sẽ gãy khi bạn viết negative test có body. Đây cũng hơi giống thói quen Selenium "DriverFactory tự tạo driver" — trong Playwright, built-in fixture đã lo create + dispose + đọc config theo project.
- Hint: client chỉ cần một `APIRequestContext` → inject thẳng fixture `request`. Chỉ dùng `newContext` khi thật sự cần context khác (vd: context có header `Authorization` riêng ở các ngày sau). Docs: https://playwright.dev/docs/api-testing#using-request-context , https://playwright.dev/docs/api/class-fixtures#fixtures-request

**[Medium] tests/api/products.api.spec.ts:10-12, 19-21, 27-29 — mỗi bước gọi API 2 lần (`...Raw()` rồi typed method)**
- Vấn đề: `getProductsRaw()` + `toBeOK()` rồi `getProducts()` → 2 HTTP request cho cùng một dữ liệu; bước detail cũng vậy.
- Vì sao: (1) `toBeOK()` thừa vì `parseJson` đã throw khi `!response.ok()`; (2) chậm gấp đôi; (3) **flakiness**: bạn assert trên response A nhưng lấy data từ response B — nếu data thay đổi giữa 2 lần gọi (test khác tạo/sửa product chạy song song, hoặc site reset) thì 2 kết quả lệch nhau.
- Hint: chọn một trong hai cho mỗi test: happy path → chỉ gọi typed method (status đã được guard trong `parseJson`); khi cần cả status lẫn body → gọi Raw một lần rồi parse chính response đó. Nghĩ xem `parseJson` có thể được export để test dùng lại trên response Raw không.

**[Low] src/api/http.ts:11 — `as T` không validate gì ở runtime**
- Vấn đề: `(await response.json()) as T` chỉ là "lời hứa" với compiler. So sánh Python: giống `typing.cast(Product, data)` — không check gì, khác hẳn `pydantic.parse_obj`.
- Vì sao: nếu API đổi field (vd `price` thành string), test vẫn compile và có thể vẫn pass. Interface của bạn mới là "tài liệu", chưa phải "contract test". Đó cũng là lý do dòng `expect(Array.isArray(body.data)).toBe(true)` vẫn có giá trị.
- Hint: keyword `zod` / JSON Schema validation (`ajv`), hoặc so với Swagger của Toolshop. Không cần làm ngay — để dành cho ngày contract/schema testing.

**[Low] src/api/types/common.ts:10,13 — field `from`/`to` ghi "cần verify" nhưng chưa verify**
- Hint: gọi `GET /products?page=999` một lần (Swagger UI hoặc test nháp) rồi chốt type, xoá comment TODO. Type "đoán" dễ thành type sai lâu dài.

**[Low] src/api/categories.client.ts, src/api/auth.client.ts:12 — code chưa có test dùng**
- Vấn đề: `CategoriesClient` và `AuthClient.login()` (typed) chưa được test nào gọi → chưa biết type `CategoryTree` / `AuthResponse` có đúng không.
- Hint: thêm 1 test cho `/categories/tree` (assert cấu trúc cây) và 1 test login thành công dùng credential từ `config.customer` (đã có sẵn qua dotenv) — assert `token_type`, `expires_in > 0`.

**[Low] tests/api/products.api.spec.ts:3, 19, 25, 49 + src/fixtures/index.ts — formatting/naming**
- Dòng trống thừa (line 3), typo `listReponse`, ngoặc thừa `(await productsClient.getProductById(...))`, trailing space + thiếu trailing comma ở line 49–51. `prettier --check` báo 2 file.
- Hint: chạy `npx prettier --write .` trước commit; cân nhắc `lint-staged` + husky hoặc thêm `prettier --check` vào CI.

**[Low] docs/daily-log.md — `###Day12` / `###Day13` thiếu space**
- Markdown không render thành heading. Quy ước của repo là heading `## YYYY-MM-DD` — bạn có rồi, dòng `###DayNN` có thể bỏ hoặc sửa thành `### Day13`.

## Làm tốt

1. **Tách Raw vs Typed trong client** (`products.client.ts`): Raw trả `APIResponse` cho negative test (assert 404/401), typed trả `Promise<Product>` cho happy path. Đây đúng là design hay dùng trong API framework thực tế — test 404 và 401 của bạn dùng Raw đúng chỗ.
2. **Generic `Paginated<T>` + `parseJson<T>`** với error message có URL/status/body (cắt 500 ký tự): dùng generic đúng cách (tương đương `Generic[T]` trong Python), và khi fail log ra đủ thông tin để debug mà không cần `console.log`.
3. **`mergeTests(pagesTest, apiTest)`** trong `src/fixtures/index.ts`: giữ fixture theo từng domain riêng rồi gộp, thay vì một file fixture khổng lồ — đúng cách Playwright khuyến nghị (https://playwright.dev/docs/test-fixtures#combine-custom-fixtures-from-multiple-modules).

## Score

| Tiêu chí | Điểm | Ghi chú |
|---|---|---|
| Correctness | 2/3 | API test đúng & pass; mất `Accept` header ở context tự tạo; suite tổng thể fail (flaky UI) |
| Locator & waiting (→ API: request/flakiness) | 2/3 | Không wait/sleep thừa; trừ điểm vì gọi API 2 lần, assert trên response khác với data dùng |
| Structure/POM (→ client/fixture) | 2/2 | Client class `private readonly request`, fixture inject client, `mergeTests` |
| Readability & TS quality | 1.5/2 | Types rõ, không `any`; trừ formatting, typo, type chưa verify |
| **Tổng** | **7.5/10** | |

**Kết luận: NEEDS FIX** — score ≥ 7 nhưng còn 1 issue High (full suite fail). Lưu ý: issue High này không do code day13 gây ra; sửa xong flaky `goto` (hoặc chạy lại xanh ổn định) là đủ điều kiện PASS. Nên sửa luôn 2 issue Medium trước khi commit `day13`.

## Câu hỏi kiểm tra hiểu bài

Trong `parseJson<T>`, nếu Toolshop trả về `{"id": 1, "name": null}` cho endpoint mà interface `Product` khai báo `id: string; name: string`, thì `npx tsc --noEmit` có báo lỗi không, và test có fail không? Giải thích vì sao — và từ đó, TypeScript type khác gì so với runtime validation?
