# Review day14 — Hybrid: API tạo data → UI verify → API cleanup

**Mục tiêu roadmap (D14):** Hybrid: tạo data bằng API → verify bằng UI → cleanup.
**Phạm vi:** commit `ad2582c day14: Hybrid test: API create data → UI verify → API cleanup` — `src/api/users.client.ts`, `src/api/types/user.ts`, `src/api/http.ts`, `src/fixtures/data.fixture.ts`, `src/fixtures/{api,index}.fixture.ts`, `src/data/user.factory.ts`, `src/config/env.ts`, `.env.example`, `tests/e2e/user.hybrid.spec.ts`.

## Kiểm tra tự động

| Lệnh                                    | Kết quả                                                                                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit`                      | ✅ pass                                                                                                                                                                                      |
| `npx eslint .`                          | ✅ pass                                                                                                                                                                                      |
| `npx playwright test --reporter=list`   | ✅ **22/22 passed** (12.7s, 6 workers) — hybrid test 6.5s, teardown delete user OK (nếu `ensureOk` throw thì test đã đỏ)                                                                     |
| `npx prettier --check src tests` (thêm) | ⚠️ **11 file** chưa format (tăng từ 4 hôm qua): `data.fixture.ts` indent 4 space, `types/user.ts` dùng single quote, `env.ts` có dòng trailing whitespace, thiếu newline cuối file hàng loạt |

## Issues

**[Medium] src/fixtures/data.fixture.ts:18-22 — mỗi test login admin 1 lần trong teardown**

- Vấn đề: `authClient.login(admin)` nằm trong teardown của fixture **test-scoped** → N test dùng `newUser` = N lần login admin. Ngoài ra login nằm _sau_ `use()`: nếu login admin fail (sai env, site chậm, rate limit), user đã tạo sẽ bị **leak** và lỗi lại báo ở teardown, khó đọc.
- Vì sao: Toolshop có cơ chế đếm `failed_login_attempts` / có thể throttle login; khi có 20–30 hybrid test chạy 6 workers, việc spam login admin dễ gây flaky. Đây hơi giống thói quen pytest "mọi thứ trong 1 fixture function-scope".
- Hint: tách 1 fixture `adminToken` (hoặc `adminUsersClient`) với `{ scope: "worker" }` — login 1 lần mỗi worker, fixture `newUser` chỉ phụ thuộc vào nó. Tương đương pytest `scope="session"`/`"module"`. Lưu ý: worker fixture **không** dùng được fixture test-scoped (`apiContext` hiện là test-scoped) → bạn sẽ phải tự tạo context trong worker fixture; và cân nhắc `expires_in` của token. Lấy token **trước** `use()` cũng giúp fail sớm thay vì leak data. Docs: https://playwright.dev/docs/test-fixtures#worker-scoped-fixtures

**[Low] tests/e2e/user.hybrid.spec.ts:18,22 — `toHaveURL(/\/account/)` lặp 2 lần**

- Step 2 assert lại đúng điều step 1 vừa assert. Bỏ 1 chỗ; nếu muốn step 1 chỉ là "action", để assertion URL ở step 2.

**[Low] tests/e2e/user.hybrid.spec.ts:20-24 — "verify bằng UI" mới chỉ chứng minh login được**

- Vấn đề: tên `newUser.firstName/lastName` là hằng số `"Test User"` — giống hệt mọi user khác do factory sinh ra, nên assertion tên không chứng minh được đây là **đúng** user vừa tạo.
- Hint: cho factory sinh `firstName`/`lastName` có phần unique (giống `uniqueEmail`), hoặc verify thêm 1 field đặc trưng ở trang Profile (`/account/profile`: email, city, phone) — đó là chỗ thể hiện rõ "data tạo bằng API hiển thị đúng ở UI".

**[Low] src/data/user.factory.ts:12 — `country: "VN"` trong `RegisterForm` (model của UI)**

- Vấn đề: `RegisterForm` là data cho **UI form** (dropdown hiển thị "Viet Nam"), nhưng giá trị giờ là **country code** của API. Nếu sau này viết UI register test dùng `createUser()` và `selectOption({ label: form.country })` sẽ fail.
- Hint: việc convert UI ↔ API nên nằm ở hàm mapper `toCreateUserRequest` (bạn đã có — đặt đúng chỗ rồi), hoặc model field rõ nghĩa hơn (`countryCode`). Một nguồn data, mapping tách bạch.

**[Low] src/config/env.ts:44-47 + .github/workflows/playwright.yml:25-27 — env mới bắt buộc ở import time**

- `requireEnv("ADMIN_EMAIL")` chạy khi load config → **mọi** test (cả UI không cần admin) crash nếu thiếu biến. Workflow CI hiện chỉ truyền `CUSTOMER_EMAIL/PASSWORD` (thiếu cả `CUSTOMER_NAME`, `BASE_URL`, `API_URL` từ trước). CI đang tắt nên chưa đỏ, nhưng ghi chú lại để khi bật ở D23 không bị bất ngờ.
- Hint: khi bật lại CI, bổ sung đủ secrets/vars cho tất cả biến trong `.env.example`.

**[Low] src/api/users.client.ts:26 — comment "có thể là 204" chưa verify**

- Giống issue `from/to` hôm qua: một lần gọi DELETE và xem status thật, rồi viết comment khẳng định (hoặc dùng `toBe(204)` trong 1 API test của D15).

**[Low] 11 file fail `prettier --check`**

- Số file tăng dần qua mỗi ngày → dấu hiệu editor chưa bật format on save. `data.fixture.ts` indent 4 space lệch hẳn phần còn lại.
- Hint: bật Prettier làm default formatter + "Format on Save" trong VS Code, hoặc thêm script `npm run format` / `lint-staged`. Đây là lần thứ 3 issue này xuất hiện — nên giải quyết bằng tooling, không bằng trí nhớ.

## Làm tốt

1. **Fixture setup → `use()` → teardown đúng pattern**: `newUser` tạo user, `await use(newUser)`, rồi delete — teardown chạy kể cả khi test fail (bạn cũng ghi đúng điều này trong daily-log). So với Python: tương đương `yield` fixture trong pytest, nhưng test chỉ cần "khai báo" `newUser` trong tham số là có data + cleanup, không cần `try/finally` trong test.
2. **Tách `ensureOk` khỏi `parseJson`**: `deleteUser` chỉ cần check status, không parse body — refactor nhỏ nhưng đúng (Single Responsibility), và message lỗi URL/status/body vẫn dùng chung.
3. **Type `CreateUserResponse extends Omit<CreateUserRequest, "password" | "address" | "phone">`**: tận dụng utility type để không lặp field, đồng thời **loại `password`** khỏi response type đúng ý nghĩa. Kết hợp `uniqueEmail()` (UUID) + `test.use({ storageState: { cookies: [], origins: [] } })` → test hybrid độc lập, chạy song song an toàn và không dính session của customer từ setup project.

## Score

| Tiêu chí                              | Điểm       | Ghi chú                                                                                                                   |
| ------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| Correctness                           | 3/3        | Đủ 3 pha API create → UI verify → API cleanup, suite 22/22 xanh, cleanup thực sự chạy                                     |
| Locator & waiting (+ flakiness)       | 2.5/3      | Locator qua POM, web-first assertion, không wait thừa; trừ vì login admin mỗi test (rủi ro throttle khi scale)            |
| Structure/POM (→ fixture/client/data) | 1.5/2      | Fixture layering `api → data → index` rõ ràng; trừ: admin token chưa tách worker-scope, model UI/API lẫn nhau ở `country` |
| Readability & TS quality              | 1.5/2      | Types tốt, không `any`; trừ: prettier 11 file, assertion lặp, comment chưa verify                                         |
| **Tổng**                              | **8.5/10** |                                                                                                                           |

**Kết luận: PASS** ✅ — không có issue High. Nên xử lý issue Medium (worker-scoped admin token) trước khi viết thêm hybrid test ở các ngày sau, và bật format on save.

## Câu hỏi kiểm tra hiểu bài

Giả sử bạn đổi fixture `adminToken` sang `{ scope: "worker" }` nhưng vẫn khai báo nó phụ thuộc vào `authClient` (đang dựa trên `apiContext` test-scoped). Playwright sẽ báo lỗi gì, vì sao — và nếu test fail giữa chừng ở UI step, thứ tự teardown của các fixture `newUser`, `apiContext`, `page`, `adminToken` sẽ diễn ra thế nào?
