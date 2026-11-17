# Review day07 — 2026-11-17

**Mục tiêu D7 (roadmap):** custom fixtures bằng `test.extend<...>()` để inject page objects.
**Phạm vi:** commit `909a46e` (`src/fixtures/pages.fixture.ts`, `src/fixtures/index.ts`, `HomePage` thêm `goto`/`signInLink`, refactor 3 spec, xoá `locators.spec.ts`, daily-log).

## Kiểm tra tự động

| Lệnh                                          | Kết quả                                                                          |
| --------------------------------------------- | -------------------------------------------------------------------------------- |
| `npx tsc --noEmit`                            | ✅ 0 lỗi                                                                         |
| `npx eslint .`                                | ✅ 0 lỗi                                                                         |
| `npx playwright test --reporter=list` (lần 1) | ❌ **2 failed**, 7 passed: `Login success @smoke`, `Search for a product @smoke` |
| Chạy riêng 2 test fail                        | ✅ 2/2 passed, nên đây là **flaky**, không phải fail cố định                     |
| `--repeat-each=3` (27 lần chạy)               | ❌ 3 failed: `No result search` fail **3/3**                                     |
| `--repeat-each=4` (36 lần chạy)               | ❌ 1 failed: `No result search`                                                  |
| `login.spec.ts --repeat-each=8` (32 lần chạy) | ✅ 32/32, lỗi `Login success` **không tái hiện được**                            |

Mục tiêu D7 về code đạt: fixture có type, inject đúng, test không còn `new XxxPage(page)`. Nhưng suite **không ổn định**, nên theo rule review đây là issue High.

## Issues

**[High] tests/ui/search.spec.ts:4-6, 8-37 + src/pages/HomePage.ts:25-27 — 2 test search flaky do race giữa request load trang chủ và request search**
— Hiện tượng: "No result search" (search `abc`) fail với `search_completed` chứa **9 sản phẩm mặc định của trang chủ** (Combination Pliers … Thor Hammer). Lần chạy đầu, "Search for a product" (search `hammer`) cũng fail: `filter({ hasNotText: "hammer" })` match 5 phần tử, đúng bằng 5 sản phẩm không phải hammer trong 9 sản phẩm mặc định.
— Root cause: mình đã kiểm chứng bằng một script riêng trong scratchpad (không đụng code của bạn), log thứ tự network qua 4 lần chạy:

- ~1.1s: `GET /products` (danh sách trang chủ) **được gửi**
- ~1.9s: `GET /products/search?q=abc` **được gửi**, trong khi request đầu **chưa trả về**
- ~2.0–2.1s: response `/products` về
- ~2.3–2.4s: response `/products/search` về

Ở máy mình, response search luôn về **sau** nên kết quả đúng. Nhưng khi chạy 6 workers song song, server chậm hơn, và nếu response `/products` về **sau** response search thì Angular render đè danh sách mặc định lên kết quả search. Có 2 request cạnh tranh nhau và response về cuối sẽ thắng.
— Vì sao ngày hôm qua không bị: day05/day06 có dòng `await expect(product.first()).toBeVisible()` **trước** khi search. Dòng đó vô tình đóng vai trò "chờ danh sách ban đầu load xong". Day07 đã bỏ nó, **theo đúng hint sai của mình ở review day06** (mình viết "precondition có thể bỏ vì `fill` đã auto-wait textbox"). **Đó là nhận định sai của reviewer, xin lỗi bạn.** Auto-wait chỉ đảm bảo _textbox actionable_ (visible, enabled, stable). Nó **không** biết app còn request nào đang bay. Đây là giới hạn quan trọng của auto-wait.
— Điểm hay: assertion chặt bạn viết từ day05/06 (`searchResults` scoped + `filter(...).toHaveCount(0)` + `toHaveCount(0)`) chính là thứ **bắt được** race này. Với assertion lỏng của day05 thì test sẽ false-pass.
— Hint:

1. Bài học chung: trước khi tương tác, test phải chờ **trạng thái "trang sẵn sàng" của app**, không chỉ chờ element. Câu hỏi để tự hỏi: "user thật sẽ thấy gì trước khi họ gõ search?"
2. Đặt sự chờ này ở đâu là câu hỏi thiết kế. Có thể ở `beforeEach`, hoặc trong `HomePage.goto()`. Với lựa chọn thứ hai, cần cân nhắc rule "không assertion trong POM": một `expect` dùng để _đồng bộ_ (sync) khác với `expect` dùng để _kiểm chứng_ (verify). Tra keyword: `locator.waitFor()`.
3. Cách chính xác nhất là chờ đúng response `/products` (tiền đề cho D16). Keyword: `page.waitForResponse`, chú ý phải **đăng ký trước** hành động gây ra request.
4. Kiểm chứng sau khi sửa: `npx playwright test tests/ui/search.spec.ts --repeat-each=10`, phải xanh 20/20.
5. Góc nhìn tester: đây cũng có thể là **bug thật của app**. User gõ search nhanh lúc trang chưa load xong sẽ thấy kết quả sai, vì app không huỷ request cũ (Angular hay xử lý bằng `switchMap`). Đáng ghi vào daily-log như một "finding".

— Docs: https://playwright.dev/docs/actionability · https://playwright.dev/docs/api/class-page#page-wait-for-response

**[Low] tests/ui/login.spec.ts:9-13 — `Login success @smoke` fail 1 lần ở lần chạy đầu, không tái hiện được trong 48 lần chạy sau**
— Vì sao: mình không giữ được error detail của lần đó (lần chạy sau đã ghi đè `test-results/`). Vì vậy không kết luận nguyên nhân, có thể do server demo chậm/rate-limit khi 6 workers cùng login một account. Nhưng **flaky không rõ nguyên nhân thì không được bỏ qua**.
— Hint: chuẩn bị sẵn công cụ để lần sau bắt được: đổi `trace` trong config sang `"retain-on-failure"` khi chạy local, rồi mở bằng `npx playwright show-trace`. Đây là chủ đề D19, có thể làm sớm. Nếu gặp lại, ghi lại error message vào daily-log.

**[Low] tests/ui/login.spec.ts:11, 18 — dùng `loginPage.page` và request thêm fixture `page` không nhất quán**
— Vì sao: test 1 dùng `loginPage.page`, đúng là chỗ rò abstraction mà day06 đã cảnh báo khi `page` để public. Test 2 lại request thêm `{ loginPage, page }`. Hai cách khác nhau cho cùng một việc.
— Hint: chọn 1 cách và giữ nó. Nếu chuyển sang `private readonly page` (carry-over day06), TS sẽ **cấm** `loginPage.page` và buộc bạn chọn cách còn lại. Đây là ví dụ hay về việc dùng type system để ép convention, giống Python `_private` nhưng được compiler thực thi chứ không chỉ là quy ước.

**[Low] src/pages/LoginPage.ts:11, 20 — `pageTitle` ("My account") đặt trong `LoginPage`**
— Vì sao: element này chỉ có **sau khi** login, ở trang `/account`. Đặt nó trong `LoginPage` là sai "nhà". Khi trang Login có title riêng, tên `pageTitle` sẽ gây nhầm.
— Hint: như day06 đã gợi ý, có thể tạo `AccountPage` nhỏ và thêm fixture `accountPage`. Hôm nay làm cực rẻ vì chỉ cần thêm 1 dòng trong `PageFixtures`. Đây chính là lợi ích của D7.

**[Low] tests/ui/home.smoke.spec.ts:4-6 — vẫn `page.goto("/")` thay vì `homePage.goto()`; file "smoke" nhưng không có tag `@smoke`**
— Vì sao: login/search đã dùng `goto()` của page object, file này thì chưa, nên kiến thức URL lại nằm 2 nơi. Tên file nói "smoke" nhưng `--grep @smoke` không chọn 3 test này.
— Hint: dùng fixture `homePage` trong `beforeEach`, và gắn tag ở cấp `describe`.

**[Low] src/pages/HomePage.ts:16-18, 21 — chuỗi `"search_completed"` lặp 2 lần**
— Vì sao: `searchResults` và `searchResultsContainer` cùng định nghĩa container riêng. Nếu `data-test` đổi, bạn phải sửa 2 chỗ.
— Hint: locator có thể **chain từ locator khác**. Hãy định nghĩa container trước rồi build `searchResults` từ nó.

**[Low] Carry-over (không lặp chi tiết)**

- `src/pages/*.ts`: chưa dùng parameter property `private readonly page` (từ day06).
- `login.spec.ts:23`: `not.toHaveURL("/account")` pass ngay lần check đầu (từ day05).
- `package.json`: `scripts` vẫn rỗng.
- `docs/daily-log.md`: mục "Câu hỏi reviewer" của Day07 để trống, heading `## Day07` lệch format `## YYYY-MM-DD` trong CLAUDE.md.

## Làm tốt

1. **Fixture viết đúng chuẩn và có type**: `base.extend<PageFixtures>`, mỗi fixture `await use(instance)`, test nhận `{ loginPage }` qua destructuring. Không còn `new LoginPage(page)` lặp trong từng test, không biến module-level, không `let` + `beforeEach`. Đây đúng là câu trả lời cho câu hỏi day05 mà bạn đã tự viết trong daily-log. So với pytest: `await use(x)` tương đương `yield x` trong fixture, và `test.extend` tương đương việc đăng ký fixture trong `conftest.py`, nhưng có **type** đi kèm nên IDE autocomplete được `loginPage.`.
2. **Gom export qua `src/fixtures/index.ts`**, test chỉ import `{ test, expect }` từ một chỗ. Khi thêm fixture (API client ở D12, `mergeTests`…) bạn không phải sửa import trong mọi spec.
3. **Đã sửa toàn bộ issue day06**: `LoginPage.goto()` đúng URL và được dùng trong `beforeEach`, `loginError` vào POM, naming `emailInput`/`passwordInput`/`productNames` nhất quán, bỏ `.first()` thừa, thêm `toHaveCount(0)` cho no-result, tag "Invalid email", xoá `locators.spec.ts`. Câu trả lời câu hỏi day06 trong daily-log (Locator là "recipe", `ElementHandle` vs `StaleElementReferenceException`) rất chính xác.

## Score

| Tiêu chí                     | Điểm                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| Correctness (3)              | 1.5: suite flaky (search fail lặp lại được khi chạy song song) + 1 lần login fail chưa rõ nguyên nhân  |
| Locator & waiting (3)        | 2: locator tốt và assertion chặt; trừ 1 vì thiếu bước chờ "trang sẵn sàng" trước khi tương tác         |
| Structure/POM (2)            | 1.5: fixture chuẩn; trừ vì `pageTitle` sai trang, `loginPage.page` rò, `home.smoke` chưa dùng `goto()` |
| Readability & TS quality (2) | 1.5: naming đã nhất quán; còn chuỗi testid lặp, parameter property, carry-over                         |
| **Tổng**                     | **6.5 / 10**                                                                                           |

**Kết luận: NEEDS FIX** ❌. Còn 1 issue High (flaky search), score < 7. Issues: High 1 · Medium 0 · Low 6.
Code fixture của D7 về bản chất đã tốt. Điểm thấp chủ yếu vì race condition, mà race này một phần bắt nguồn từ hint sai của reviewer ở day06. Sửa High rồi chạy `--repeat-each=10` cho search.spec, xanh hết thì gọi `/review day07` lại để re-review.

## Câu hỏi kiểm tra hiểu bài

Trong test "Invalid password", bạn request cả `{ loginPage, page }`.

(a) `page` mà test nhận và `page` bên trong `loginPage` (được truyền vào ở `pages.fixture.ts:13`) là **cùng một object** hay hai tab khác nhau? Vì sao? (keyword: fixture được cache trong phạm vi một test, test-scoped)
(b) Ở `search.spec.ts`, test chỉ request `homePage`. Fixture `loginPage` có bị khởi tạo không? So sánh với `@pytest.fixture(autouse=True)`: Playwright fixture mặc định là lazy hay eager, và option nào làm nó giống `autouse`?
(c) Nếu sau này `homePage` fixture cần teardown (ví dụ xoá giỏ hàng sau test), code teardown đặt ở đâu so với `await use(homePage)`, và nó có chạy khi test fail không?
Docs: https://playwright.dev/docs/test-fixtures

## Re-review 16:32

**Phạm vi:** commit `1253011` (`HomePage.goto()` thêm bước chờ, `AccountPage` + fixture `accountPage`, `page` chuyển sang `private`, `home.smoke` dùng `homePage.goto()` + tag `@smoke`, chain locator `searchResults`, workflow chuyển sang `workflow_dispatch`, daily-log trả lời câu hỏi).

### Kiểm tra tự động

| Lệnh                                                 | Kết quả                      |
| ---------------------------------------------------- | ---------------------------- |
| `npx tsc --noEmit`                                   | ✅ 0 lỗi                     |
| `npx eslint .`                                       | ✅ 0 lỗi                     |
| `npx playwright test --reporter=list`                | ✅ 9/9 passed (6 workers)    |
| `npx playwright test --repeat-each=10` (90 lần chạy) | ✅ **90/90 passed**, 0 flaky |

### Trạng thái issue lần 1

| Issue                                             | Trạng thái                                                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [High] Race `/products` vs `/products/search`     | ✅ Fixed: `HomePage.goto()` chờ product đầu tiên render rồi mới trả về. 90/90 xanh, kể cả `No result search` |
| [Low] `Login success` fail 1 lần không rõ lý do   | ✅ Không tái hiện trong 90 lần. Hint `trace: "retain-on-failure"` vẫn chưa làm (xem bên dưới)                |
| [Low] `loginPage.page` vs `{ page }`              | ✅ Fixed: `page` thành `private`, cả 2 test dùng fixture `page`. TS giờ cấm `loginPage.page`                 |
| [Low] `pageTitle` sai nhà                         | ✅ Fixed: chuyển sang `AccountPage` + fixture `accountPage`                                                  |
| [Low] `home.smoke` không dùng `goto()`, thiếu tag | ✅ Fixed: `homePage.goto()` trong `beforeEach`, tag ở cấp `describe`                                         |
| [Low] `"search_completed"` lặp 2 lần              | ✅ Fixed: `searchResults` chain từ `searchResultsContainer`                                                  |
| Carry-over                                        | ⚠️ Một phần (xem bên dưới)                                                                                   |

### Issues còn lại

**[Low] src/pages/HomePage.ts:26 + tests/ui/home.smoke.spec.ts:12-14 — bước chờ trong `goto()` làm test "at least one product card" gần như trùng lặp và đổi chỗ fail**
— Vì sao: `goto()` giờ luôn chờ `productNames.first()` xuất hiện. Nếu trang chủ không load được product, test sẽ fail ở **`beforeEach`** với lỗi `locator.waitFor: Timeout`, chứ không fail ở assertion `not.toHaveCount(0)` với message dễ đọc. Đồng thời `has title` và `Sign in link exists` cũng fail theo, dù title/link vẫn ổn. Đây là trade-off khi đặt bước "sync" vào `goto()`: mọi caller đều phải trả giá.
— Hint: không bắt buộc sửa, nhưng hãy cân nhắc 1 trong 2 hướng: (1) tách thành `goto()` thuần và một method/fixture "chờ sẵn sàng" mà chỉ search test dùng; hoặc (2) giữ nguyên, nhưng hiểu rằng test `should display at least one product card` giờ chủ yếu là "tài liệu sống". Ngoài ra, chờ DOM chỉ là **proxy** cho "response `/products` đã về". Cách chính xác hơn vẫn là `page.waitForResponse` đăng ký trước `goto` (học kỹ ở D16).

**[Low] src/pages/AccountPage.ts:4,7 — field `page` được gán nhưng không bao giờ đọc**
— Vì sao: `AccountPage` chưa có method nào dùng `this.page`, nên đây là dead field. `tsc` không báo vì `noUnusedLocals` chưa bật trong `tsconfig.json`. Trong khi đó URL `"/account"` lại hardcode trong `login.spec.ts:14`, nên kiến thức về trang Account nằm ở 2 nơi.
— Hint: hoặc bỏ field (YAGNI), hoặc cho nó việc để làm, ví dụ để `AccountPage` "sở hữu" path `/account` giống cách `LoginPage.goto()` sở hữu `/auth/login`. Tra thêm `noUnusedLocals` / `noUnusedParameters` trong tsconfig nếu muốn compiler bắt dead code.

**[Low] Carry-over (không lặp chi tiết)**

- `src/pages/*.ts`: vẫn khai báo field rồi gán trong constructor, chưa dùng parameter property `constructor(private readonly page: Page)` (từ day06). Lưu ý khi đổi: `tsconfig` đang `target: "esnext"`, nên nếu khởi tạo locator bằng **field initializer** (`readonly x = this.page...`) thì hãy chạy `tsc` để kiểm tra thứ tự khởi tạo. Giữ phần gán locator trong thân constructor là an toàn nhất. Keyword: `useDefineForClassFields`.
- `playwright.config.ts:30`: vẫn `trace: "on-first-retry"`, mà local `retries: 0` nên chạy local **không bao giờ có trace**. Hint `retain-on-failure` từ lần 1 chưa làm.
- `package.json`: `scripts` vẫn rỗng.
- `docs/daily-log.md`: các heading `# DayNN` (H1) đang nằm **dưới** `## YYYY-MM-DD` (H2), cấu trúc markdown bị ngược cấp. Dùng `### DayNN` sẽ đúng hơn. Mục Day07 cũng chưa ghi lại "finding" về race condition của app và cách bạn đã fix. Đây là bài học đáng giá nhất của hôm nay.

### Làm tốt

1. **Chọn `locator.waitFor()` thay vì `expect` trong POM**: đúng tinh thần "sync khác verify". `waitFor` nói rõ ý định "chờ trạng thái" chứ không phải "kiểm chứng". `.first()` ở đây cũng **có lý do**: `waitFor` cần locator resolve ra đúng 1 element (strict mode), khác với `.first()` thừa từng bị flag ở day05/06. Kết quả: 90/90 xanh.
2. **Dùng type system để ép convention**: đổi `page` sang `private` khiến `loginPage.page` không còn compile được, và test tự nhiên chuyển sang fixture `page`. Thêm `AccountPage` chỉ tốn 1 class, 1 dòng type và 1 fixture, minh hoạ rõ lợi ích của D7.
3. **Trả lời câu hỏi kiểm tra chính xác**: fixture test-scoped được cache (cùng 1 `page`), lazy mặc định và `{ auto: true }` ≈ `autouse=True`, teardown sau `await use()` chạy cả khi fail ≈ code sau `yield`. So sánh với pytest đúng chỗ.

### Score

| Tiêu chí                     | Điểm                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| Correctness (3)              | 3: suite ổn định, 90/90 với 6 workers                                                     |
| Locator & waiting (3)        | 2.5: sync đúng chỗ, đúng API; trừ 0.5 vì chờ qua DOM proxy và áp cho mọi caller           |
| Structure/POM (2)            | 1.5: fixture/POM sạch; trừ vì `AccountPage.page` là dead field, URL `/account` nằm ở test |
| Readability & TS quality (2) | 1.5: naming tốt; còn carry-over parameter property, `scripts` rỗng, heading daily-log     |
| **Tổng**                     | **8.5 / 10**                                                                              |

**Kết luận: PASS** ✅. Không còn issue High, score ≥ 7. Issues: High 0 · Medium 0 · Low 3.

### Câu hỏi kiểm tra hiểu bài

`HomePage.goto()` giờ có `await this.productNames.first().waitFor()`.

(a) `locator.waitFor()` mặc định chờ state nào? Nếu gọi `this.productNames.waitFor()` (bỏ `.first()`) khi trang có 9 product thì chuyện gì xảy ra, và vì sao?
(b) Giả sử bạn chuyển sang chờ đúng response `/products` bằng `page.waitForResponse`. Vì sao viết `await page.goto("/"); await page.waitForResponse(...)` theo thứ tự đó là **sai/flaky**, và pattern đúng là gì? (keyword: tạo promise trước, `await` sau)
(c) Nếu nhiều spec cần "home đã sẵn sàng", bạn có thể tạo fixture `readyHomePage` thay vì nhét bước chờ vào `goto()`. So sánh ngắn 2 cách: ai trả giá thời gian chờ, và lỗi hiện ra ở đâu khi product không load?
Docs: https://playwright.dev/docs/api/class-locator#locator-wait-for · https://playwright.dev/docs/api/class-page#page-wait-for-response
