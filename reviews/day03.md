# Review day03 — Locators (`getByRole` / `getByLabel` / `getByTestId`)

**Phạm vi:** commit `87ecf38` (day03: locators with getByRole/getByLabel/getByTestId)
Files: `playwright.config.ts`, `tests/ui/locators.spec.ts`, `docs/daily-log.md`

**Mục tiêu D3 (roadmap):** dùng `getByRole`, `getByLabel`, `getByTestId`, cấu hình `testIdAttribute: 'data-test'`, `codegen` chỉ để quan sát.
→ Đủ cả 3 loại locator + đã cấu hình `testIdAttribute`. Đạt mục tiêu.

## Kiểm tra tự động

| Lệnh                                   | Kết quả                                |
| -------------------------------------- | -------------------------------------- |
| `npx tsc --noEmit`                     | ✅ pass (exit 0)                        |
| `npx eslint .`                         | ✅ pass (0 problem)                     |
| `npx playwright test --reporter=list`  | ✅ 6 passed (4.8s, 6 workers, chromium) |

## Issues

**[Medium] `tests/ui/locators.spec.ts:11-14` — `getByLabel("Email address *", { exact: true })` khoá cứng cả dấu `*` (required marker)**
— Label thật trên DOM là `Email address *` / `Password *` (mình đã kiểm tra). Dấu `*` chỉ là trang trí UI. Nếu dev đổi `*` thành icon, thêm khoảng trắng, hay bỏ marker thì cả 4 dòng đều vỡ, dù field vẫn y nguyên. `exact: true` + full text giống thói quen Selenium viết XPath `//label[text()='Email address *']`: match tuyệt đối theo chuỗi hiển thị. Thêm nữa, cùng một locator được viết lại 2 lần (dòng 11 + 13, 12 + 14). Đổi label thì phải sửa 2 chỗ.
— Hint: dùng substring mặc định (không `exact`) hoặc regex `/email address/i`. Mình đã thử: `getByLabel(/email address/i)` và `getByLabel(/^password/i)` đều match đúng 1 element. Gán locator vào `const` rồi dùng lại (bạn đã làm đúng như vậy với `product` ở dòng 19). Tra: _playwright.dev/docs/api/class-page#page-get-by-label_ (option `exact`).

**[Medium] `tests/ui/locators.spec.ts:21` — `getByTestId("search-query")` trong khi `getByRole` dùng được**
— Daily-log hôm nay bạn tự ghi: _"test id: dùng khi không thể get by role, text,…"_. Nhưng input search có `placeholder="Search"`, nên accessible name là "Search". Mình đã thử `getByRole("textbox", { name: /search/i })` và nó match đúng 1 element. Thấy `id`/`data-test` là lấy ngay, đó chính là thói quen `By.ID` của Selenium. `getByRole` vừa kiểm tra element đúng loại (textbox) vừa đúng cách user/screen reader nhận ra nó.
— Hint: mở DevTools → tab **Accessibility** trên input search để xem Role + Name. Hoặc dùng `npx playwright codegen` / nút "Pick locator" trong UI mode: Playwright sẽ gợi ý locator nó ưu tiên. Tra: _playwright.dev/docs/locators#quick-guide_ (thứ tự ưu tiên).

**[Low] `tests/ui/locators.spec.ts:20` — guard chống flaky đúng hướng nhưng thiếu lý do**
— `await expect(product.first()).toBeVisible()` là cách fix đúng kiểu Playwright: đồng bộ theo **trạng thái app** bằng web-first assertion, không dùng sleep. Nhưng người đọc sau (kể cả bạn sau 2 tuần) sẽ không biết vì sao dòng này tồn tại, và `.first()` trông như thừa. Blocker trong daily-log mới mô tả triệu chứng, chưa có root cause. Nhiều khả năng đây là race: request load danh sách ban đầu về **sau** request search, rồi ghi đè kết quả search.
— Hint: chạy lại bản cũ với `--repeat-each=10 --trace=on`, mở trace, xem tab **Network**: 2 request `/products` về theo thứ tự nào? Ghi root cause vào comment 1 dòng hoặc gói lại bằng `test.step("wait for initial product list", …)` (D5). D16 sẽ học `waitForResponse`, cách đồng bộ trực tiếp theo network.

**[Low] `tests/ui/locators.spec.ts:25` — `toHaveCount(1)` phụ thuộc dữ liệu live**
— Site practice có thể thêm product chứa "Combination Pliers" (vd "Combination Pliers Pro"). Khi đó test fail dù search vẫn hoạt động đúng. Đây là rủi ro flaky do data, không phải do code.
— Hint: cân nhắc assert "mọi kết quả đều chứa keyword" thay vì "đúng 1 kết quả". Tra `toHaveText` với **mảng** / regex, hoặc `filter({ hasNotText })` + `toHaveCount(0)`. Tạm thời giữ cũng được, ghi chú lại để D14 (tạo data bằng API) xử lý triệt để.

**[Low] `tests/ui/locators.spec.ts:9-15` — test "Fill login form" chỉ kiểm tra chính `fill()`**
— Fill rồi assert `toHaveValue` cùng giá trị đó là đang test Playwright, không test app. Làm bài tập locator thì OK, nhưng đừng giữ test kiểu này trong suite thật.
— Hint: D4 (login happy/negative) sẽ thay test này bằng test có hành vi: submit → assert redirect / error message.

**[Low] `tests/ui/locators.spec.ts` — đặt tên file theo _chủ đề học_, không theo _feature_; test 1 trùng với `home.smoke.spec.ts:19`**
— `locators.spec.ts` chứa test login + search. Tên test vẫn chưa theo convention (carry-over day02). "Navigate to login page" và "Sign in link exists" cùng test link Sign in.
— Hint: khi refactor (D5/D10), tách theo feature: `login.spec.ts`, `search.spec.ts`, rồi gộp test trùng lại.

**[Low] `playwright.config.ts:29` + `locators.spec.ts:27` — format không đồng nhất**
— `testIdAttribute: 'data-test'` dùng single quote và thiếu trailing comma, trong khi cả file dùng double quote. Spec file thiếu newline cuối file. Nguyên nhân gốc vẫn là carry-over: Prettier chưa có trong `devDependencies`.
— Hint: xem issue Prettier ở `reviews/day02.md`. Có `npx prettier --check .` là phát hiện được ngay.

**[Low] carry-over**
— ✅ Đã sửa: `"type": "module"` (ESM) khớp `tsconfig` (Medium day02).
— ❌ Chưa sửa: `src/data/types.ts` + `products.ts` vẫn chưa được import ở đâu (dead code, Medium day02). Ngoài ra `scripts: {}`, `"typescript": "<6.1"`, boilerplate comment trong config, Prettier.
— Hint: D6–D9 sẽ dùng `src/data`. Nếu chưa dùng thì xoá đi, đến lúc cần thì tạo lại.

**[Low] `docs/daily-log.md:39-48` — entry day03 nằm chung heading `## 2026-11-16` với day02, phần "Học" chỉ có 1 chữ**
— Sau này đọc lại sẽ khó tách được việc của từng ngày. Phần "Làm" hiện đang chứa kiến thức học được.
— Hint: thêm sub-heading `### day03`. "Học" nên ghi 1–2 insight cụ thể (vd: accessible name đến từ đâu, `exact` hoạt động thế nào).

## Thói quen Selenium/Python

- **Exact-text label matching** (`"Email address *"`, `exact: true`): tương đương `//label[text()='…']`. Playwright mặc định match _substring, case-insensitive_. Hãy match theo **ý nghĩa**, đừng match theo chuỗi pixel-perfect.
- **Ưu tiên `data-test` như `By.ID`**: trong Selenium, ID/attribute là lựa chọn "an toàn nhất". Trong Playwright thì `getByRole` đứng đầu vì nó gắn với cách user nhìn trang. `getByTestId` là phương án cuối.
- **Không thấy** `sleep`, `waitForSelector`, `expect(await x.textContent())`. Flaky được xử lý bằng web-first assertion. 👍

## Làm tốt

1. **Locator lazy được khai báo trước `page.goto` và dùng lại 3 lần** (`locators.spec.ts:19`, dùng ở 20, 25, 26). Trong Selenium, `find_element` trước khi load trang sẽ `NoSuchElementException`, và giữ element lâu thì dính `StaleElementReferenceException`. Bạn đã dùng đúng bản chất Locator của Playwright: chỉ là "công thức tìm", mỗi lần dùng mới resolve lại.
2. **Fix flaky bằng web-first assertion, không bằng sleep** (`locators.spec.ts:20`). Thứ tự assert sau search cũng hợp lý: `search-caption` → `toHaveCount(1)` → `toHaveText`. Mỗi bước đều auto-retry, không có chỗ nào đọc text rồi tự so sánh.
3. **Cấu hình `testIdAttribute: "data-test"` ở config** (`playwright.config.ts:29`) thay vì rải `locator('[data-test="…"]')` trong test. Đổi attribute chỉ cần sửa 1 chỗ.

## Score

| Tiêu chí                     | Điểm                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| Correctness (3)              | 3: tsc/eslint/test pass, đủ mục tiêu D3                                                           |
| Locator & waiting (3)        | 2: không wait thủ công, fix flaky đúng kiểu; trừ cho label exact có `*` và testid thay cho role  |
| Structure/POM (2)            | 1.5: locator lặp lại, file theo chủ đề học, `src/data` vẫn dead code                             |
| Readability & TS quality (2) | 1.5: format không đồng nhất, thiếu comment cho guard chống flaky, tên test chưa theo convention   |
| **Tổng**                     | **8 / 10**                                                                                        |

**Kết luận: PASS** (≥ 7, không có High). Issues: High 0 · Medium 2 · Low 7.

## Câu hỏi kiểm tra hiểu bài

Giả sử form login có thêm field label **"Confirm email address \*"**:
(a) `page.getByLabel("Email address")` (không `exact`) sẽ match mấy element? Khi gọi `.fill()` thì Playwright làm gì, và vì sao nó **không** tự lấy element đầu tiên như `driver.find_element` của Selenium? (keyword: _strict mode_)
(b) Viết lại locator đó sao cho vẫn **không** phụ thuộc dấu `*` mà chỉ match đúng field "Email address". Chỉ cần mô tả hướng làm (regex hay option nào), không cần code đầy đủ.
