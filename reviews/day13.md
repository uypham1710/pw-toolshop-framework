# Review day13 — API client layer có types

**Mục tiêu roadmap (D13):** API client layer có types (interface cho request/response).
**Phạm vi:** chưa commit → review `git diff` + file mới `src/api/**`, `src/fixtures/api.fixture.ts`, `src/fixtures/index.ts`, `tests/api/products.api.spec.ts`.

## Kiểm tra tự động

| Lệnh                                  | Kết quả                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `npx tsc --noEmit`                    | ✅ pass                                                                  |
| `npx eslint .`                        | ✅ pass                                                                  |
| `npx playwright test --reporter=list` | ❌ **19 passed, 2 failed** (lần 1)                                       |
| `npx prettier --check` (thêm)         | ⚠️ `src/fixtures/index.ts`, `tests/api/products.api.spec.ts` chưa format |

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

| Tiêu chí                                     | Điểm       | Ghi chú                                                                                    |
| -------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| Correctness                                  | 2/3        | API test đúng & pass; mất `Accept` header ở context tự tạo; suite tổng thể fail (flaky UI) |
| Locator & waiting (→ API: request/flakiness) | 2/3        | Không wait/sleep thừa; trừ điểm vì gọi API 2 lần, assert trên response khác với data dùng  |
| Structure/POM (→ client/fixture)             | 2/2        | Client class `private readonly request`, fixture inject client, `mergeTests`               |
| Readability & TS quality                     | 1.5/2      | Types rõ, không `any`; trừ formatting, typo, type chưa verify                              |
| **Tổng**                                     | **7.5/10** |                                                                                            |

**Kết luận: NEEDS FIX** — score ≥ 7 nhưng còn 1 issue High (full suite fail). Lưu ý: issue High này không do code day13 gây ra; sửa xong flaky `goto` (hoặc chạy lại xanh ổn định) là đủ điều kiện PASS. Nên sửa luôn 2 issue Medium trước khi commit `day13`.

## Câu hỏi kiểm tra hiểu bài

Trong `parseJson<T>`, nếu Toolshop trả về `{"id": 1, "name": null}` cho endpoint mà interface `Product` khai báo `id: string; name: string`, thì `npx tsc --noEmit` có báo lỗi không, và test có fail không? Giải thích vì sao — và từ đó, TypeScript type khác gì so với runtime validation?

---

## Re-review 12:23 (2026-11-28)

**Phạm vi:** commit `0e746ed day13: Update test script based on review` — `playwright.config.ts`, `src/fixtures/api.fixture.ts`, `tests/api/products.api.spec.ts`, `docs/daily-log.md`.

### Kiểm tra tự động

| Lệnh                                    | Kết quả                                                                                                                       |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit`                      | ✅ pass                                                                                                                       |
| `npx eslint .`                          | ✅ pass                                                                                                                       |
| `npx playwright test --reporter=list`   | ✅ **21/21 passed** (11.8s, 6 workers)                                                                                        |
| `npx prettier --check src tests` (thêm) | ⚠️ 4 file: `api.fixture.ts`, `fixtures/index.ts`, `utils/assert.ts`, `products.api.spec.ts` — **chỉ thiếu newline cuối file** |

### Tình trạng các issue lần trước

| Issue cũ                                                    | Trạng thái                                                                                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [High] full suite fail (UI `goto` timeout)                  | ✅ Lần này suite xanh. `HomePage.goto()` không đổi → nguyên nhân là site live chập chờn; xem Low #4 bên dưới                                                              |
| [Medium] `apiContext` mất `Accept` header                   | ✅ Đã chuyển `extraHTTPHeaders` vào `newContext`, `baseURL` API giờ chỉ khai báo 1 nơi. Bạn giữ `newContext` thay vì dùng `request` fixture — chấp nhận được (xem Low #3) |
| [Medium] gọi API 2 lần (Raw + typed)                        | ✅ Đã fix gọn: happy path chỉ gọi typed, negative path chỉ gọi Raw. Data assert giờ chính là data lấy về → hết rủi ro lệch dữ liệu                                        |
| [Low] `as T` không validate runtime                         | ⏸ Để dành cho ngày schema testing — OK                                                                                                                                    |
| [Low] `from`/`to` "cần verify"                              | ❌ Chưa làm (Low #2)                                                                                                                                                      |
| [Low] `CategoriesClient`, `AuthClient.login()` chưa có test | ❌ Chưa làm (Low #1)                                                                                                                                                      |
| [Low] formatting/typo                                       | 🟡 Typo, ngoặc thừa, dòng trống, trailing comma đã sửa; còn thiếu newline cuối file                                                                                       |
| [Low] `###DayNN` thiếu space                                | ✅ Đã sửa                                                                                                                                                                 |

### Issues còn lại

**[Low] src/api/categories.client.ts, src/api/auth.client.ts:12 — vẫn chưa có test dùng typed method**

- Vì sao: type `CategoryTree` (đệ quy `sub_categories`) và `AuthResponse` vẫn chỉ là "đoán". Client không có test = dead code về mặt verify.
- Hint: 1 test `getCategoryTree()` (assert mảng không rỗng, node gốc có `parent_id === null`), 1 test `login(config.customer)` happy path (assert `token_type`, `expires_in > 0`). Credential lấy từ `config`, không hardcode.

**[Low] src/api/types/common.ts:10,13 — comment "cần verify" vẫn còn**

- Hint: gọi `getProducts(999)` một lần là biết `from`/`to` có `null` không → chốt type, xoá comment.

**[Low] src/fixtures/api.fixture.ts:16-25 + playwright.config.ts:42-45 — hệ quả của việc bỏ `use` trong project `api`**

- Vấn đề: project `api` giờ kế thừa `baseURL: config.baseUrl` (URL **UI**) từ `use` global. Code hiện tại không dùng `request` fixture nên chưa sao, nhưng nếu sau này ai viết `async ({ request }) => request.get("/products")` trong `tests/api` thì sẽ gọi nhầm sang frontend và nhận HTML.
- Hint: chọn 1 "nguồn sự thật" cho cấu hình API: hoặc (a) để `baseURL`/`extraHTTPHeaders` ở project `api` và fixture dùng `request` built-in, hoặc (b) giữ `newContext` như hiện tại nhưng ghi chú rõ "trong tests/api dùng client fixtures, không dùng `request` trực tiếp". Cách (b) hợp lý khi bạn sắp cần context có header `Authorization` riêng (ngày auth API). Docs: https://playwright.dev/docs/api-testing#configuration

**[Low] src/pages/HomePage.ts:38 — `goto` vẫn chờ `load` mặc định (rủi ro flaky còn đó)**

- Lần này xanh, nhưng lần trước fail ngẫu nhiên vì `load` trên site live. Code chưa thay đổi → trên CI (1 worker, mạng khác) vẫn có thể đỏ.
- Hint: tra `waitUntil: "domcontentloaded"` — bạn đã có `productNames.first().waitFor()` để đảm bảo trang sẵn sàng. Không bắt buộc hôm nay.

**[Low] tests/api/products.api.spec.ts:45-56 — describe "Auth API" nằm trong file `products.api.spec.ts`**

- Vì sao: tên file nói "products" nhưng chứa test login → khó tìm, report gom sai nhóm. Mỗi file spec nên ứng với 1 resource/client.
- Hint: tách sang `tests/api/auth.api.spec.ts` — cũng là chỗ để đặt test login happy path ở Low #1.

**[Low] 4 file thiếu newline cuối file (`\ No newline at end of file`)**

- Hint: bật `"files.insertFinalNewline": true` hoặc "Format on Save" với Prettier trong VS Code; chạy `npx prettier --write .` trước commit.

### Làm tốt

1. **Mỗi test gọi API đúng 1 lần, đúng "tầng"**: `GET /products` và `GET /products/{id}` chỉ dùng typed method (status được guard bởi `parseJson`), test 404/401 chỉ dùng Raw. Đây chính là lợi ích của tách Raw/Typed — test ngắn, đọc như spec.
2. **Test title theo kiểu `METHOD /path returns <kết quả>`** (`GET /products/{id} returns 404 for a non-existent id`) + tag `@api`: đọc report là biết endpoint nào hỏng, filter được bằng `--grep @api`.
3. **Assertion có ý nghĩa nghiệp vụ**: `toBeLessThanOrEqual(body.per_page)` kiểm tra contract phân trang chứ không chỉ "có data"; `toMatchObject` so detail với item trong list — so sánh partial đúng chỗ thay vì `toEqual` toàn object.

### Score

| Tiêu chí                                     | Điểm     | Ghi chú                                                                                   |
| -------------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| Correctness                                  | 3/3      | Suite 21/21 xanh, header `Accept` đã có, không còn gọi API thừa                           |
| Locator & waiting (→ API: request/flakiness) | 2.5/3    | Hết rủi ro 2 response lệch nhau; trừ vì `goto` UI vẫn còn rủi ro `load`                   |
| Structure/POM (→ client/fixture)             | 2/2      | Fixture gọn (`await use(new X(...))`), baseURL 1 nơi                                      |
| Readability & TS quality                     | 1.5/2    | Naming/title tốt; trừ: client chưa test, TODO type, test auth sai file, newline cuối file |
| **Tổng**                                     | **9/10** |                                                                                           |

**Kết luận: PASS** ✅ — không còn issue High/Medium. Các Low nên dọn dần, ưu tiên Low #1 + #5 (tách `auth.api.spec.ts` + thêm login happy path) vì nó chuẩn bị cho phần auth API sắp tới.

### Câu hỏi kiểm tra hiểu bài

Project `api` của bạn giờ không có `use` riêng. Nếu trong `tests/api/products.api.spec.ts` bạn viết thêm một test dùng **cả** `productsClient` **và** built-in `request`: `request.get("/products")` sẽ gọi tới URL nào, có header `Accept: application/json` không — và vì sao `apiContext` của bạn và `request` là **hai** `APIRequestContext` khác nhau (gợi ý: ai tạo, đọc config từ đâu, ai `dispose`)?
