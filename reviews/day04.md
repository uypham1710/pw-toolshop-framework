# Review day04: Web-first assertions + login tests

**Commit:** `44dcfd8 day04: login tests with web-first assertions`
**Files:** `src/data/users.ts`, `tests/ui/login.spec.ts`
**Mục tiêu D4 (roadmap):** web-first assertions `expect()`, auto-wait, soft assertions; test login happy/negative.

## Kiểm tra tự động

| Lệnh                                   | Kết quả                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| `npx tsc --noEmit`                     | ✅ pass                                                                                 |
| `npx eslint .`                         | ✅ pass                                                                                 |
| `npx playwright test --reporter=list`  | ✅ 10/10 pass (chromium, 6 workers, 8.0s)                                               |
| `npx prettier --check src tests` (thêm) | ⚠️ 3 file chưa format: `src/data/users.ts`, `tests/ui/login.spec.ts`, `tests/ui/locators.spec.ts` |

Mục tiêu D4 đã đủ: có happy path, 3 negative case, dùng web-first assertion và `expect.soft`.

## Issues

**[High] `src/data/users.ts:6-9` — Email cá nhân + password thật bị hardcode, đã commit và push lên GitHub (`origin/main`)**
— Repo này có remote GitHub. Nếu repo public thì ai cũng đọc được password. Kể cả repo private, password vẫn nằm trong git history: sửa file ở commit sau **không** xoá được nó. Nếu bạn dùng password này ở nơi khác (Gmail, ...) thì rủi ro còn lớn hơn. CLAUDE.md cũng ghi rõ "không hardcode credential".
— Hint:
  1. **Việc gấp nhất:** đổi password tài khoản Toolshop này, và đổi ở mọi nơi khác đang dùng cùng password. Hãy coi password cũ là đã lộ.
  2. Đưa credential ra `.env` (`.gitignore` đã có `.env`), thêm `.env.example` chỉ chứa tên biến, đọc bằng `process.env` qua dotenv. Roadmap để việc này ở D8, nhưng với credential thật thì nên làm ngay.
  3. Toolshop có sẵn tài khoản demo công khai (xem phần "login" trên trang hoặc README của repo `testsmith-io/practice-software-testing`). Dùng tài khoản demo thì không bao giờ lộ gì của bạn.
  4. (Tuỳ chọn) Xoá khỏi history: keyword `git filter-repo`, "GitHub removing sensitive data". Bước này rewrite history nên phải force-push.
— Thói quen Selenium/Python: `config.py` với `USER = "..."` hardcode. Bên Python có `python-dotenv` + `os.getenv`, và bên Node làm y hệt.

**[Medium] `tests/ui/login.spec.ts:15-24` + `:4-13` — Test "Invalid password" dùng chung account với "Login success", có thể làm account bị lock**
— Toolshop có cơ chế khoá account sau vài lần login sai liên tiếp. Bạn hãy tự kiểm chứng bằng cách login sai 3–4 lần bằng tay. Hiện chỉ có 1 lần sai nên vẫn pass. Nhưng khi bật `retries` trên CI, chạy `--repeat-each` (D19), thêm firefox/webkit (D18), hoặc 2 worker chạy cùng lúc, số lần sai sẽ cộng dồn. Account bị lock thì **"Login success" sẽ fail dù code không sai**. Đây là flaky kiểu "shared state ngoài process", và `fullyParallel` không cứu được.
— Ngoài ra, account tự đăng ký có thể mất khi site reset DB định kỳ.
— Hint: negative test không cần account thật. Dùng một email **không tồn tại** (vd: tạo random theo `testInfo` hoặc timestamp) là đủ để có message "Invalid email or password". Happy path thì dùng demo account. Đọc thêm: https://playwright.dev/docs/test-parallel#isolate-test-data-between-parallel-workers

**[Medium] `tests/ui/login.spec.ts:22` — `await expect(page).not.toHaveURL("/account")` là assertion yếu: nó pass ngay lập tức**
— Assertion phủ định retry cho tới khi điều kiện "không phải /account" đúng. Ngay sau khi click thì URL vẫn đang là `/auth/login`, nên nó pass ở lần check đầu tiên, trước khi app kịp redirect. Kể cả khi bug làm login sai vẫn vào được `/account`, dòng này vẫn có thể pass. Hiện test của bạn còn đúng là nhờ dòng 23 (`login-error`).
— Hint: thứ tự quan trọng. Assert điều **khẳng định** trước (error hiện ra = server đã trả lời xong), rồi mới assert phủ định. Hoặc assert `toHaveURL(/auth\/login/)` để khẳng định vẫn ở trang login. Keyword: "negative assertions pass immediately".

**[Low] `tests/ui/login.spec.ts:38-39` — `fill("")` trên field vốn đã rỗng**
— Thói quen Selenium: `element.clear()` rồi `send_keys()` cho chắc. Trong Playwright, `fill()` đã tự clear trước khi gõ. Còn ở trang vừa `goto`, field đã rỗng sẵn, nên 2 dòng này không làm gì và còn làm người đọc tưởng có ý nghĩa đặc biệt.
— Hint: bỏ đi, chỉ cần click Login. Nếu muốn nói rõ ý "submit form rỗng" thì đặt tên test hoặc `test.step` (D5) cho rõ.

**[Low] `tests/ui/login.spec.ts:5-7, 16-18, 27, 35-36` — Locator + `goto` lặp lại ở cả 4 test**
— Lặp 4 lần thì chấp nhận được ở D4. Nhưng khi label đổi thì phải sửa 4 chỗ.
— Hint: D5 có `test.beforeEach` cho `goto`. D6 sẽ chuyển các locator này vào `LoginPage`. Hãy để ý file này vì nó là ứng viên đầu tiên cho POM.

**[Low] Prettier — `users.ts` indent 4 space, `login.spec.ts` lẫn 2 space; `locators.spec.ts` vẫn chưa format (carry-over day02/day03)**
— Hint: `npx prettier --write .` rồi thêm script `"format:check"` vào `package.json` để CI bắt.

**[Low] `docs/daily-log.md` — chưa có entry day04**
— Quy ước repo yêu cầu mỗi ngày ghi "học gì / làm gì / blocker". Hãy ghi 1–2 insight thật về web-first assertion: retry bao lâu, `expect.soft` khác `expect` ở đâu.

**[Low] Tên test** — `"Login success"`, `"Invalid email"` chưa nói được kết quả mong đợi.
— Hint: dạng `"should show error when password is wrong"` hoặc nhóm bằng `test.describe("Login")` (D5).

## Thói quen Selenium/Python

- **Hardcode credential trong data module**: tương đương `config.py` chứa `PASSWORD = "..."`. Hãy dùng env var giống `os.getenv`.
- **Clear trước khi nhập** (`fill("")`): không cần vì `fill()` đã tự clear.
- **Dùng chung 1 user thật cho mọi test**: với pytest chạy tuần tự thì ít khi lộ lỗi. Với Playwright `fullyParallel` + retries + nhiều browser thì đây là nguồn flaky số 1.
- **Không thấy** `waitForTimeout`, `waitForSelector`, hay `expect(await x.textContent()).toBe(...)`. Cả 4 test đều dùng web-first assertion. 👍

## Làm tốt

1. **`expect.soft` dùng đúng chỗ** (`login.spec.ts:41-42`): 2 validation error độc lập trên cùng một trạng thái màn hình. Soft giúp report cả 2 lỗi trong 1 lần chạy thay vì dừng ở lỗi đầu. Đây đúng là use case mà docs khuyến nghị, không lạm dụng soft cho các bước phụ thuộc nhau.
2. **`toHaveURL("/account")` dựa vào `baseURL`** (`:11`) thay vì hardcode full URL, và assert thêm `page-title` sau redirect. Hai assertion này cùng xác nhận login "thật sự xong", không chỉ "đã đổi URL".
3. **`toHaveText` với regex `/i`** (`:23, 31, 41-42`): match theo ý nghĩa message, không phụ thuộc hoa/thường hay dấu câu. Đây là áp dụng đúng bài học "đừng match pixel-perfect" từ review day03. Label `/^password/i` cũng tránh được strict-mode conflict với các field có chữ "password" khác.

## Score

| Tiêu chí                     | Điểm                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| Correctness (3)              | 2: tsc/eslint/test pass, đủ mục tiêu D4; trừ vì credential bị lộ và rủi ro account lock               |
| Locator & waiting (3)        | 2.5: role/label/regex tốt, không wait thủ công; trừ cho `not.toHaveURL` pass ngay                      |
| Structure/POM (2)            | 1.5: có `interface User` + tách data; locator/goto lặp 4 lần (chấp nhận được trước D6)                |
| Readability & TS quality (2) | 1.5: code ngắn gọn, dễ đọc; Prettier chưa sạch, `fill("")` thừa, tên test chưa rõ kết quả mong đợi    |
| **Tổng**                     | **7.5 / 10**                                                                                          |

**Kết luận: NEEDS FIX**. Score ≥ 7 nhưng còn 1 issue **High** (credential). Issues: High 1 · Medium 2 · Low 5.

## Câu hỏi kiểm tra hiểu bài

Ở test "Empty email and password" (`:41-42`):
(a) Nếu dòng 41 (`expect.soft` cho `email-error`) fail, dòng 42 có chạy không? Kết quả cuối cùng của test là gì? Mỗi assertion soft chờ tối đa bao lâu trước khi kết luận fail, và giá trị đó config ở đâu trong `playwright.config.ts`?
(b) Giả sử sau dòng 42 bạn thêm `await page.getByRole("button", { name: /login/i }).click()`. Khi đó việc dòng 41 dùng `expect.soft` thay vì `expect` có thể gây hại gì? Gợi ý: keyword `test.info().errors`.
