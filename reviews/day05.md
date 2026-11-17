# Review day05 — 2026-11-17

**Mục tiêu D5 (roadmap):** `test.describe`, hooks, tags (`@smoke`), `test.step`; 5 test login/search.
**Phạm vi:** commit `fb73323` (login.spec.ts, search.spec.ts) + `67cc275` (daily-log).

## Kiểm tra tự động

| Lệnh                                  | Kết quả                                     |
| ------------------------------------- | ------------------------------------------- |
| `npx tsc --noEmit`                    | ✅ 0 lỗi                                    |
| `npx eslint .`                        | ✅ 0 lỗi                                    |
| `npx playwright test --reporter=list` | ✅ 12/12 passed, 6 workers, 9.8s (chromium) |

Mục tiêu D5 đạt về số lượng: 4 test login + 2 test search, có `describe`, `beforeEach`, tag `@smoke`/`@regression`, `test.step`.

## Issues

**[Medium] tests/ui/search.spec.ts:22-23 — assertion của "Search for a product" có thể pass khi kết quả search chưa hiện ra**
— Vì sao:

1. Trên Toolshop, sản phẩm **đầu tiên ở trang chủ chính là "Combination Pliers"** (mình đã kiểm tra qua API `/products?page=1`). Nên `product.first()` toContainText("Pliers") ở dòng 22 **pass ngay với danh sách cũ trước khi search**. Assertion này không chứng minh được gì.
2. `product.filter({ hasNotText: productName })` toHaveCount(0) ở dòng 23 sẽ **pass "vacuously" (pass suông)** nếu list đang rỗng, ví dụ đúng lúc Angular xoá list cũ để render list mới. Dù search có trả kết quả sai thì test vẫn có thể pass, tức là false-pass.
3. `search-caption` ở dòng 19 chỉ chứng minh caption đã đổi, không chứng minh grid sản phẩm đã render xong.
   Đây là test `@smoke`. Test smoke mà false-pass còn nguy hiểm hơn test fail.
   — Hint:

- Bạn đã dùng `data-test="search_completed"` ở test "No result". Hãy xem element đó có xuất hiện ở case **có kết quả** không. Nếu có thì nó là tín hiệu "search xong" để chờ trước khi assert list.
- Thêm một assertion **positive** rằng list không rỗng trước khi assert "không có item nào sai". Keyword: `not.toHaveCount(0)`. Thứ tự đúng là "có item" rồi mới tới "không item nào lệch".
- Chọn search term mà sản phẩm đầu trang chủ **không** match, để assertion thật sự phân biệt được trạng thái trước và sau search.
- Sang D16 sẽ có thêm `page.waitForResponse` để chờ đúng API search.
- Docs: https://playwright.dev/docs/test-assertions#negating-matchers

**[Low] tests/ui/login.spec.ts:10-11, 20-21, 44-45 — locator email/password khai báo lặp ở 3 test**
— Vì sao: lặp là chấp nhận được ở D5. Nhưng cẩn thận với cách "fix" mà dân pytest hay làm: khai báo `let email: Locator` ở `describe` rồi gán trong `beforeEach`. Đó là thói quen `self.email = ...` trong `setup_method`/`setUp` của Python, và trong Playwright nó tạo **shared mutable state ở scope module**, đi ngược với test isolation.
— Hint: cứ để lặp tới D6. Cách đúng là đưa vào **POM** (`readonly` Locator trong class), sau đó D7 inject bằng fixture `test.extend`. Docs: https://playwright.dev/docs/pom

**[Low] tests/ui/login.spec.ts:46-47 — `fill("")` vẫn còn (carry-over lần 5)**
— Vì sao: form vừa load thì field đã rỗng sẵn. Dòng này không làm gì nhưng người đọc tưởng nó có ý nghĩa.
— Hint: xoá đi, hoặc nếu muốn chủ đích "user không nhập gì" thì để tên test nói điều đó.

**[Low] tests/ui/login.spec.ts:31 — "Invalid email" không có tag**
— Vì sao: 5/6 test có tag còn test này thì không. Chạy `--grep @regression` sẽ bỏ sót nó mà không ai biết. Tag chỉ có giá trị khi có **quy ước nhất quán**.
— Hint: đặt quy ước "mỗi test có ít nhất 1 tag". Có thể gắn tag ở **cấp `test.describe`** (describe cũng nhận object `{ tag }`) để mọi test bên trong kế thừa, rồi test smoke thêm `@smoke`. Docs: https://playwright.dev/docs/test-annotations#tag-tests

**[Low] tests/ui/login.spec.ts (cả file), tests/ui/search.spec.ts:11, 30 — dùng `test.step` chưa đều**
— Vì sao: login.spec không có step nào, kể cả "Login success" là flow nhiều bước nhất. Ở search.spec, bước chuẩn bị (`expect(product.first()).toBeVisible()`) lại nằm ngoài step, nên trong report/trace phần đầu test không có nhãn.
— Hint: `test.step` có giá trị nhất với flow nhiều pha (Arrange → Act → Assert). Thử bọc "Login success" thành 2 step rồi mở `npx playwright show-report` để so sánh. Docs: https://playwright.dev/docs/api/class-test#test-step

**[Low] tests/ui/login.spec.ts:28 — `not.toHaveURL("/account")` gần như luôn pass**
— Vì sao: negative web-first assertion pass **ngay lần check đầu tiên** nếu điều kiện đã thoả. Lúc đó page vẫn ở `/auth/login` nên dòng này không bắt được gì (trừ trường hợp redirect đã xảy ra trước đó).
— Hint: assertion error message ở dòng 25 mới là bằng chứng chính. Nếu muốn chặt hơn, assert **positive** rằng vẫn ở trang login (URL login, hoặc nút Login vẫn visible).

**[Low] tests/ui/locators.spec.ts:19 — test "Search for a product" trùng với search.spec.ts**
— Vì sao: file bài tập D3 còn nằm trong suite, trùng tên test, không có describe/tag. Report sẽ có 2 test cùng tên ở 2 file, khó đọc. Nó cũng không được chọn khi chạy theo tag.
— Hint: gộp phần có giá trị (assertion `toHaveCount(1)` + `toHaveText` exact khá tốt) vào search.spec rồi xoá hoặc archive file bài tập.

**[Low] package.json:8 — `scripts` vẫn rỗng (carry-over)**
— Vì sao: hôm nay đã có tag, đây là lúc hợp lý để có script `test:smoke` / `test:regression`. CI ở D24 cũng sẽ dùng các script này.
— Hint: keyword `--grep`, `--grep-invert`, npm scripts.

**[Low] docs/daily-log.md:79 — mục "Câu hỏi reviewer" để trống, câu hỏi day04 (`toHaveURL`) chưa trả lời**
— Vì sao: mục "Học" hiện chỉ chép lại commit message. Daily-log có giá trị khi ghi điều _mới hiểu ra_, ví dụ khác biệt `beforeEach` vs `beforeAll`, hay tag hiển thị thế nào trong report.
— Hint: trả lời câu hỏi day04 và câu hỏi cuối review này vào log.

## Làm tốt

1. **`beforeEach` chỉ làm navigation và không share state**: hook chỉ chứa `page.goto`, không có biến module-level nào bị gán trong hook. Nhờ vậy suite chạy `fullyParallel` 6 workers vẫn 12/12 xanh. Đây đúng là cách dùng hook trong Playwright: mỗi test có `page` riêng từ fixture.
2. **Tag dùng details object `{ tag: [...] }`** thay vì nhét `@smoke` vào title string. Đây là API mới và đúng chuẩn. Reporter vẫn hiển thị tag, và `--grep` vẫn hoạt động (bạn đã tự kiểm chứng trong daily-log).
3. **`product.filter({ hasNotText }).toHaveCount(0)`** là cách viết đúng tư duy Playwright cho ý "mọi item đều match". Nó thay cho thói quen Selenium/Python `for el in elements: assert name in el.text`. Ý tưởng đúng, chỉ cần thêm điều kiện "list không rỗng" (xem issue Medium).

## Score

| Tiêu chí                     | Điểm                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| Correctness (3)              | 2.5: suite xanh, đủ mục tiêu D5; trừ 0.5 vì smoke search có nguy cơ false-pass        |
| Locator & waiting (3)        | 2.5: locator tốt (role/label/testid); trừ 0.5 vì chưa chờ đúng tín hiệu "search xong" |
| Structure/POM (2)            | 1.5: describe + hook gọn; còn lặp locator (chờ D6) và file bài tập trùng test         |
| Readability & TS quality (2) | 1.5: tag/step chưa nhất quán, `fill("")` carry-over, scripts rỗng, daily-log thiếu    |
| **Tổng**                     | **8.0 / 10**                                                                          |

**Kết luận: PASS** ✅. Score ≥ 7, không có issue High. Issues: High 0 · Medium 1 · Low 8.
Ưu tiên sửa issue Medium ở search.spec trước khi sang D6, vì test đó sẽ được refactor sang POM và nên mang theo assertion đúng.

## Câu hỏi kiểm tra hiểu bài

Giả sử để bỏ lặp locator, bạn viết trong `test.describe("Login tests")`:
khai báo `let email: Locator;` ở cấp describe, rồi trong `beforeEach(async ({ page }) => ...)` gán `email = page.getByLabel(...)`.

(a) Với `fullyParallel: true` và 6 workers, cách này có gây lỗi không? Gợi ý: mỗi worker là một **process riêng** hay một thread? File test được load bao nhiêu lần? Trong **cùng một worker**, các test chạy tuần tự hay song song?
(b) Nếu đổi `beforeEach` thành `beforeAll`, bạn có dùng được fixture `page` không? Vì sao Playwright thiết kế như vậy (keyword: test-scoped vs worker-scoped fixture)?
(c) Vậy vì sao vẫn khuyên **không** dùng pattern này, và D6/D7 thay nó bằng gì?
Docs: https://playwright.dev/docs/test-parallel · https://playwright.dev/docs/test-fixtures
