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
