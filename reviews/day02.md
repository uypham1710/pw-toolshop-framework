# Review day02 — 2026-11-16

**Phạm vi:** commit `8101efc day02: TS basics (types, import type) + home smoke tests` (code chính: `src/data/types.ts`, `src/data/products.ts`, `tests/ui/home.smoke.spec.ts`, `playwright.config.ts`; phần còn lại là reformat Prettier + docs).
**Mục tiêu D2 (roadmap):** TS basics cho tester (types, interface, async/await, import/export); viết smoke test trang chủ.

| Mục tiêu                       | Trạng thái                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| types / interface              | ✅ `Category` (union literal) + `interface Product` có `readonly`                                       |
| import / export                | ✅ `import type` đúng với `verbatimModuleSyntax`                                                        |
| async/await                    | ✅ mọi Playwright call đều `await`, kể cả `expect`                                                      |
| Smoke test trang chủ           | ✅ 3 test: title, product cards, Sign in link                                                           |
| Gắn TS basics vào code thực tế | ⚠️ `types.ts`/`products.ts` chưa được dùng ở đâu, data là ví dụ chung chung (xem Medium #1)             |

## Kiểm tra tự động

| Lệnh                                  | Kết quả                                   |
| ------------------------------------- | ----------------------------------------- |
| `npx tsc --noEmit`                    | ✅ pass, 0 error                          |
| `npx eslint .`                        | ✅ pass, 0 warning                        |
| `npx playwright test --reporter=list` | ✅ 3/3 passed (chromium, 3 workers, 3.1s) |

Env: Node v24.11.0 · Playwright 1.65.1 · TypeScript 6.0.3

## Issues

Không có issue **High**.

**[Medium] `src/data/types.ts:1-10`, `src/data/products.ts:3` — type và data không phản ánh domain Toolshop, và chưa được import ở đâu (dead code)**
— `Category = "Electronics" | "Clothing" | "Books"` và `"Example Product"` là data của một shop tưởng tượng. Toolshop bán dụng cụ (Hand Tools, Power Tools, Other…), và product từ API có field khác hẳn (vd `in_stock` snake_case, `brand`, `category` là object chứ không phải string, `id` có thể là string). Bài tập TS sẽ có giá trị gấp đôi nếu type bạn viết hôm nay dùng lại được ở D9 (factory) và D13 (API types). Hiện tại không test nào import `products`, nên đây là dead code; ESLint không bắt vì file vẫn `export`.
— So với Python: `interface` gần với `TypedDict`/`Protocol` (structural typing: object nào có đủ field thì hợp lệ, không cần "kế thừa"), còn `Category` union literal tương đương `typing.Literal[...]`. Chỉ khác là TS check lúc compile, còn runtime không check gì cả.
— Hint: mở Swagger của Toolshop (`api.practicesoftwaretesting.com`), gọi `GET /products` và `GET /categories`, rồi model lại `Product` theo response thật (chỉ lấy field cần dùng). Viết 1 test nhỏ dùng nó, vd lấy tên 1 product từ data rồi assert card đó hiển thị. Nếu chưa muốn dùng thì đừng commit, hoặc ghi rõ trong daily-log là "scratch".

**[Medium] carry-over từ day01 — `package.json:17` `"type": "commonjs"` vẫn mâu thuẫn với `tsconfig` (`module: esnext` + `verbatimModuleSyntax`)**
— Review day01 đã flag và hôm nay chưa xử lý, cũng chưa ghi trong daily-log là đã quyết định giữ. Bạn chưa gặp lỗi vì Playwright tự transpile. Lần đầu bỏ comment dòng `dotenv` (`playwright.config.ts:9`, dùng `__dirname`) hoặc chạy script bằng `tsx` thì sẽ gặp lại lỗi ESM/CJS.
— Hint: xem lại hint ở `reviews/day01.md`. Chọn một hướng và ghi lý do vào daily-log.

**[Low] `tests/ui/home.smoke.spec.ts:12-14` — locator product card dựa vào `heading level 5`**
— `getByRole("link").filter({ has: getByRole("heading", { level: 5 }) })` là cách nghĩ đúng (role + filter, không dùng CSS class). Tuy vậy `h5` là quyết định styling: dev đổi sang `h3` cho đúng heading hierarchy là test gãy dù UI không đổi gì. Đây là kiểu phụ thuộc DOM giống XPath `//a[.//h5]`, chỉ là viết đẹp hơn.
— Hint: D3 sẽ học `getByTestId` + `testIdAttribute: 'data-test'`. Mở DevTools xem card/tên sản phẩm có `data-test` gì; đó là contract ổn định hơn cho "list item". Có thể bỏ `level` và filter theo cái khác. Tra: _playwright.dev/docs/locators#filtering-locators_.

**[Low] `tests/ui/home.smoke.spec.ts:16` — `not.toHaveCount(0)` chỉ chứng minh "có element trong DOM", không chứng minh "user nhìn thấy"**
— `toHaveCount` đếm cả element bị ẩn (`display:none`, skeleton/placeholder). Với smoke test "trang chủ hiển thị sản phẩm", điều user quan tâm là card thật sự visible. Bạn đã tránh được kiểu Selenium `len(find_elements(...)) > 0` không retry (ở đây vẫn auto-retry), nên đây là cải thiện nhỏ.
— Hint: so sánh `toHaveCount`/`toBeVisible`, và xem khi nào `.first()` là hợp lý (checklist chỉ flag `.first()` _không cần thiết_). Tra: _playwright.dev/docs/test-assertions_.

**[Low] `src/data/products.ts:3` — export mảng mutable ở module-level**
— `export const products: Product[]` chỉ khóa _binding_, không khóa nội dung. Test nào đó `products.push(...)` hoặc sửa `price` là ảnh hưởng mọi test khác trong cùng worker, đúng thứ checklist #5 cấm. Giống Python: một list global trong module, `import` ở đâu cũng là cùng một object.
— Hint: tra `readonly Product[]` / `ReadonlyArray<T>` và `as const`. Hướng dài hạn (D9) là _factory function_ trả object mới mỗi lần gọi thay vì một mảng dùng chung.

**[Low] `tests/ui/home.smoke.spec.ts:3,5,9,19` — tên test không thống nhất + comment sót từ example**
— 3 kiểu đặt tên: `"has title"`, `"should display…"`, `"Sign in link exists"`. Comment dòng 5 (`// Expect a title "to contain" a substring.`) copy từ `example.spec.ts` và chỉ lặp lại điều code đã nói rõ. Khi report có 100 test, tên lộn xộn khó đọc và khó `-g` filter.
— Hint: chọn một convention (vd "home: shows title", "home: shows product cards"…) và giữ nó; D5 sẽ gom bằng `test.describe` + tag `@smoke`.

**[Low] commit `8101efc` — trộn reformat Prettier (yml, eslint config, review cũ) với feature; Prettier chưa có trong `devDependencies`**
— 14 file thay đổi nhưng chỉ ~3 file là việc của day02, nên `git log -p`/review khó đọc. Prettier đang chạy qua editor extension. Máy khác/CI không có config nên format sẽ "nhảy" qua lại (đổi `'` ↔ `"` như diff hôm nay). CLAUDE.md có ghi Prettier trong tech stack.
— Hint: cài `prettier` làm devDependency + `.prettierrc` + `.prettierignore`, thêm script `format`. Lần sau tách commit "chore: format" riêng. Tra: _eslint-config-prettier_ để ESLint và Prettier không đá nhau.

**[Low] carry-over day01 (gộp) — `package.json` `scripts: {}` + `"typescript": "<6.1"`; `playwright.config.ts` còn boilerplate comment (dòng 3-9, 41-77); CI vẫn cài cả 3 browser**
— Đã sửa: `baseURL` ✅, xoá `example.spec.ts` ✅, xoá `docs/revi` ✅, `.env` vào `.gitignore` ✅. Các mục trên chưa sửa.
— Hint: xem `reviews/day01.md`. Cách nhanh: mỗi ngày xử lý 1 mục carry-over.

## Thói quen Selenium/Python

- **Daily-log blocker: "hiểu nhầm `name` và class giống bên Selenium".** Đây chính là thói quen Selenium. Trong Selenium, `By.NAME` là _attribute_ `name="..."` và `By.CLASS_NAME` là CSS class. Còn `{ name }` trong `getByRole` là **accessible name**: text mà screen reader đọc (text content của link/button, `aria-label`, `<label>` của input, `alt` của img…). Bạn đã dùng đúng ở dòng 21 (`name: "Sign in"`). Tra: _playwright.dev/docs/locators#locate-by-role_ và mở tab **Accessibility** trong Chrome DevTools để xem "Name" của element.
- **Daily-log: "`!` định nghĩa biến đó chắc chắn không phải undefined".** Đúng, nhưng cẩn thận: `!` (non-null assertion) là _nói dối compiler_. Nếu sai thì crash lúc runtime y như Python `None` + `AttributeError`. Bạn bật `noUncheckedIndexedAccess` chính là để bị buộc xử lý `undefined`. Hãy ưu tiên _narrowing_ (`if (!x) throw …`, optional chaining `?.`) hơn `!`. ESLint `recommendedTypeChecked` có rule `no-non-null-assertion` (ở preset `strict`) nếu muốn bị nhắc.
- Không thấy `sleep`, `waitForSelector`, hay `expect(await x.textContent())`. Assertion đều là web-first.

## Làm tốt

1. **`import type { Product }` (`src/data/products.ts:1`)**: đúng yêu cầu của `verbatimModuleSyntax`. Type-only import bị xoá hẳn khi transpile nên không tạo runtime dependency. Bạn hiểu và áp dụng ngay khái niệm mới của hôm nay (Python không có phân biệt này; gần nhất là `if TYPE_CHECKING:`).
2. **Không có wait thủ công nào, dù product list load bất đồng bộ qua API** (`home.smoke.spec.ts:16`). `expect(...).not.toHaveCount(0)` tự retry đến khi API trả về. Người từ Selenium thường chèn `WebDriverWait`/`waitForSelector` ở đây.
3. **Dùng `baseURL` + `page.goto("/")`** thay vì hardcode URL trong test, đúng theo hint day01. Đến D8 chỉ cần đổi 1 chỗ trong config sang env.

## Score

| Tiêu chí                     | Điểm                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| Correctness (3)              | 3 — tsc/eslint/test đều pass, đủ mục tiêu D2                                                  |
| Locator & waiting (3)        | 2.5 — role-based, không wait thủ công; trừ cho `level: 5` và `toHaveCount` thay vì visible    |
| Structure/POM (2)            | 1.5 — data/type chưa gắn với test (dead code), commit trộn format + feature                  |
| Readability & TS quality (2) | 1.5 — type không theo domain thật, mảng mutable export, tên test lộn xộn, carry-over day01   |
| **Tổng**                     | **8.5 / 10**                                                                                 |

**Kết luận: PASS** (≥ 7, không có High). Issues: High 0 · Medium 2 · Low 6.

## Câu hỏi kiểm tra hiểu bài

Nếu ở `home.smoke.spec.ts:6` bạn **quên `await`** trước `expect(page).toHaveTitle(/Practice Software Testing/)` và site đổi title sang chuỗi khác:
(a) test sẽ pass hay fail, và vì sao (gợi ý: `toHaveTitle` trả về gì, test function kết thúc khi nào)?
(b) Trong repo này, công cụ nào sẽ bắt lỗi đó _trước khi_ chạy test, và rule tên gì?
