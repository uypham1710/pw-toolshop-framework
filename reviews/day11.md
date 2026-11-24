# Review day11 — storageState + setup project

**Commit:** `186accb day11: storageState + setup project`
**Mục tiêu (roadmap D11):** `storageState` + setup project (`dependencies`) để login 1 lần.

## Kiểm tra tự động

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ pass (0 error) |
| `npx eslint .` | ✅ pass (0 warning) |
| `npx playwright test --reporter=list` | ✅ 17/17 passed (14.7s, 6 workers) — `[setup]` chạy trước, các test `[chromium]` chạy sau |

→ Mục tiêu D11 **đạt**: setup project chạy 1 lần, các test khác dùng lại session.

## Issues

### [Medium] tests/ui/login.spec.ts:8 — Test "Login success" không còn test việc login nữa
- **Vấn đề:** Sau khi chuyển sang storageState, test này chỉ `goto("/account")` rồi assert URL + title. Nó đang kiểm tra "session được restore đúng", không phải "login thành công". Flow login thật giờ chỉ còn nằm trong `auth.setup.ts`.
- **Vì sao:** Tên test sai lệch so với nội dung → khi đọc report sẽ hiểu nhầm coverage. Và setup không phải là "test" theo nghĩa report: nếu login hỏng, bạn thấy setup fail + toàn bộ test chromium bị skip, chứ không thấy 1 test "Login" đỏ rõ ràng.
- **Hint:** 2 hướng: (a) đổi tên thành kiểu "authenticated user can open account page"; (b) giữ thêm 1 test login UI thật trong file chạy với storage rỗng (giống cách bạn đã làm ở `login.negative.spec.ts`). Cân nhắc tách "login flow" (cần storage rỗng) và "logged-in features" (dùng storageState) ra 2 file/describe.

### [Medium] playwright.config.ts:36 — Áp `storageState` cho TOÀN BỘ project chromium
- **Vấn đề:** `home`, `search`, `product.detail` giờ đều chạy ở trạng thái đã login và đều `dependencies: ['setup']`.
- **Vì sao:** (1) Nếu trang login / account lỗi → setup fail → *mọi* test (kể cả home, search vốn không cần login) bị skip — blast radius lớn. (2) Test guest-flow (vd "Add product to cart" của khách vãng lai) giờ âm thầm chạy với user đã login → kết quả có thể khác hành vi thật của guest. (3) Mọi worker dùng chung 1 account: khi sang các test cart/checkout/profile, các worker sẽ đè state lên nhau (cart của Bob Smith) → flaky khi `fullyParallel`.
- **Hint:** Tra docs "Authentication → Multiple signed in roles" và "Testing without authentication". Cân nhắc: 2 project (vd `chromium-guest` không storageState, `chromium-auth` có storageState + `testMatch`/`grep` riêng), hoặc giữ mặc định guest và chỉ `test.use({ storageState: AUTH_FILE })` ở file cần login. Về lâu dài: đọc mục "one account per parallel worker" (`testInfo.parallelIndex`).
  https://playwright.dev/docs/auth#testing-without-authentication · https://playwright.dev/docs/auth#moderate-one-account-per-parallel-worker

### [Medium] tests/ui/login.spec.ts:31 — Hardcode `"Bob Smith"` trong test
- **Vấn đề:** Tên hiển thị gắn chặt với account trong `.env` nhưng lại nằm cứng trong test.
- **Vì sao:** Đổi `CUSTOMER_EMAIL` sang user khác (vd account riêng cho CI) là test fail mà không rõ lý do. Data và credential nên đi cùng một nguồn — đây là quy ước Config & data bạn đã làm ở day08/day09.
- **Hint:** Đưa display name vào cùng chỗ với email/password (env hoặc `src/data`), ví dụ mở rộng `AppConfig.customer`. Kiểu "test data object" giống `@pytest.fixture` trả về user dict trong Python.

### [Medium] src/config/env.ts:5 + package.json — Bỏ `"type": "module"` chỉ để dùng `__dirname`
- **Vấn đề:** Bạn xoá `"type": "module"` (đổi module system của cả project từ ESM sang CommonJS) để `__dirname` dùng được.
- **Vì sao:** Đây là thay đổi lớn ở cấp project cho một nhu cầu nhỏ, và không được ghi trong commit message → sau này khó nhớ vì sao. Hiện tsc/eslint vẫn pass (ESLint config là `.mjs` nên không ảnh hưởng), nhưng nên là quyết định có chủ ý.
- **Hint:** Docs Playwright dùng path tương đối với root (`path.join(__dirname, '../playwright/.auth/user.json')` trong file setup, hoặc đơn giản `'playwright/.auth/user.json'` vì Playwright chạy từ thư mục chứa config). Trong ESM có `import.meta.dirname` (Node ≥ 20.11) ≈ `Path(__file__).parent` của Python. Chọn 1 cách và ghi lại lý do trong daily-log.

### [Low] src/pages/AccountPage.ts:6 — Tên locator `username` không khớp với element `nav-menu`
- **Vấn đề:** `data-test="nav-menu"` là nút dropdown menu ở navbar, không phải field "username" trên Account page.
- **Vì sao:** Đọc test sẽ tưởng đang check username trong nội dung trang account. Thêm nữa, navbar là component chung mọi trang — đặt nó trong `AccountPage` khiến sau này trang khác muốn check user menu phải đi qua AccountPage.
- **Hint:** Đặt tên theo ý nghĩa UI (vd `userMenu`), và cân nhắc một component object `NavBar`/`Header` (composition, không phải BasePage inheritance).

### [Low] tests/ui/login.spec.ts:32 — Dùng `loginPage.emailInput` để assert trên Account page
- **Vấn đề:** Test "Username displayed correctly" kéo `loginPage` vào chỉ để assert email input bị ẩn.
- **Vì sao:** Assert "thứ không có mặt" là tín hiệu yếu (sai locator cũng pass `toBeHidden`). Assertion thực sự có giá trị đã là `pageTitle` + user menu text. Ngoài ra dòng trống thừa ở line 35/38.
- **Hint:** Bỏ fixture không cần; giữ assertion dương tính (positive) chứng minh đã login.

### [Low] tests/auth.setup.ts:2-3 — Import 2 lần từ cùng module + style không đồng nhất
- **Vấn đề:** `config` và `AUTH_FILE` import riêng 2 dòng từ `../src/config/env`; config dùng `'setup'` (single quote) trong khi cả repo dùng double quote; thiếu newline cuối file.
- **Vì sao:** Dấu hiệu chưa chạy Prettier trước khi commit.
- **Hint:** Gộp import; chạy `npm run format` (cân nhắc lint-staged/husky hoặc thêm `prettier --check` vào `npm run check`).

### [Low] src/config/env.ts:4 — `PROJECT_ROOT` export nhưng không ai dùng ngoài file
- **Hint:** Không export nếu không cần (giữ public API của module nhỏ) — tương tự đặt `_private` trong Python module.

## Làm tốt

1. **Setup project đúng pattern docs:** `testMatch: /.*\.setup\.ts/` + `dependencies: ['setup']` + `storageState` trong `use` — đúng như "Basic: shared account in all tests". Đặc biệt setup **chờ assertion (`toHaveURL`, `toHaveText`) trước khi `storageState({ path })`** — tránh lưu state khi token chưa kịp ghi vào localStorage, lỗi rất hay gặp.
2. **Opt-out đúng cách cho negative login:** `test.use({ storageState: { cookies: [], origins: [] } })` ở `login.negative.spec.ts` — hiểu rằng test login thất bại cần context sạch.
3. **`AUTH_FILE` tập trung ở `src/config`** và dùng chung cho config + setup (không lặp string path), `playwright/.auth/` đã nằm trong `.gitignore`. Setup dùng lại fixtures `loginPage`/`accountPage` thay vì viết lại locator.

## Score

| Tiêu chí | Điểm |
|---|---|
| Correctness | 2.5 / 3 — đạt mục tiêu, tests xanh; nhưng mất coverage login thật + "Login success" gây hiểu nhầm |
| Locator & waiting | 2.5 / 3 — `getByTestId`, web-first assertion, không wait thủ công; trừ naming/vị trí `nav-menu` |
| Structure/POM | 1.5 / 2 — scope storageState quá rộng, navbar nằm trong AccountPage |
| Readability & TS quality | 1.5 / 2 — hardcode "Bob Smith", import trùng, chưa format |
| **Tổng** | **8 / 10** |

## Kết luận: ✅ PASS

(Score ≥ 7, không có issue High.) Ưu tiên sửa: tách guest vs authenticated (Medium #2) trước khi sang các bài cart/checkout.

## Câu hỏi kiểm tra hiểu bài

Toolshop lưu token login ở đâu (cookie hay `localStorage`)? Từ đó giải thích: vì sao `storageState` vẫn dùng được, và nếu bạn có 4 workers cùng chạy test **thay đổi giỏ hàng** với cùng `user.json`, chuyện gì có thể xảy ra — bạn sẽ đổi setup thế nào để mỗi worker có account riêng?
