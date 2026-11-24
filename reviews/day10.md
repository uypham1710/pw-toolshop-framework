# Review Day10: Refactor + 10+ tests (Login, Home, Product, Search/Filter)

**Commit:** `9f651c3 day10: refactor POM + add search/product tests`
**Mục tiêu roadmap D10:** Refactor + 10+ tests (Login, Home, Product, Search/Filter).

## Kiểm tra tự động

| Lệnh                                  | Kết quả                                     |
| ------------------------------------- | ------------------------------------------- |
| `npx tsc --noEmit`                    | ✅ exit 0                                   |
| `npx eslint .`                        | ✅ exit 0                                   |
| `npx playwright test --reporter=list` | ✅ 15/15 passed (9.6s, 6 workers, chromium) |

Không có lệnh nào fail, nên không có issue High từ phần này.

Kiểm tra thêm về tag (`--list`):

| Lệnh                                        | Số test    |
| ------------------------------------------- | ---------- |
| `--grep @smoke`                             | 8 / 15     |
| `--grep @regression`                        | 5 / 15     |
| `--grep @smoke --grep-invert @regression`   | 6, tức là **2 test mang cả 2 tag** |

## Đã sửa từ review day09 ✅

- `ErrorPosition` đã chuyển về `LoginPage.ts`, chiều phụ thuộc giờ đúng (data → page).
- Đã gộp login negative: `login.spec.ts` chỉ còn happy path.
- Đã gỡ `tsx` và thêm `scripts` (`test:smoke`, `typecheck`, `check`...). Việc này cũng đóng issue còn treo từ day08.
- Bỏ annotation thừa `prefix = "user"`. Smoke không còn phình theo data (`tags ?? ["@regression"]`).
- Daily-log: heading đã đổi sang `###`. Câu day08 (a) sửa thành "7 lần" là đúng (1 main process + 6 worker).

## Issues

### Medium

- **[Medium] `tests/ui/home.spec.ts:3` + `tests/ui/product.detail.spec.ts:5`: tag ở `describe` được **cộng dồn** xuống test, nên `@smoke` bị trùng và tag phân loại bị sai.**
  Vì sao: output hiện `Home page shows product grid @smoke @smoke`, `Pagination goes to next page @smoke @regression`, `Add product to cart @smoke @regression`. Tag của test không *thay thế* tag của describe mà được nối thêm vào. Kết quả là `npm run test:smoke` chạy 8/15 test, kể cả 2 test bạn định để là regression. Script `test:smoke` vừa thêm hôm nay vì vậy không còn đúng nghĩa "bộ test nhanh, quan trọng nhất". Tên describe `"Home page smoke tests"` / `"Product detail page smoke tests"` cũng sai với nội dung bên trong.
  Hint: chọn **một** chỗ gắn tag. Hoặc gắn ở describe (khi cả nhóm cùng loại), hoặc gắn ở từng test, đừng dùng cả hai. Tự kiểm bằng `npx playwright test --list --grep @smoke`. Docs: https://playwright.dev/docs/test-annotations#tag-tests

- **[Medium] Roadmap "Search/**Filter**" chưa có, và tổng số test không tăng (15 → 15).**
  Vì sao: hôm nay bạn xoá 3 login test và 3 home test cũ, rồi thêm 2 home + 2 product. Số test vẫn là 15. Vẫn ≥ 10 theo roadmap, nhưng phần Filter (category / brand / price range ở sidebar trang Home) chưa có test nào. Filter là nơi tập locator khó nhất của trang này (checkbox lồng trong cây category, slider), nên thiếu nó là thiếu phần học chính của D10.
  Hint: 1–2 test filter, ví dụ tick một category rồi assert mọi `product-name` thuộc category đó, hoặc sort theo giá. Locator nên thử `getByRole("checkbox", { name: ... })` / `getByLabel(...)`. Chú ý: sau khi tick, list sản phẩm được load lại bằng API, nên cần một "anchor" assertion trước, giống bài học caption ở day09. Keyword: `page.waitForResponse` (chỉ khi thật cần), `expect.poll`.

- **[Medium] Dead code tích tụ trong `src/data` và `src/pages`.**
  - `src/data/user.factory.ts` + `RegisterForm`: vẫn chưa test nào dùng. Đây là issue Medium từ day09, chưa xử lý và daily-log cũng không giải thích.
  - `src/data/users.ts`: từ hôm nay không còn file nào import (sau khi xoá 3 login test).
  - `src/data/products.ts`: không ai import.
  - `ProductPage.getCartQuantity()` (`src/pages/ProductPage.ts:31`) và `cartConfirmationMessage` (`:16`): không dùng. Test đã assert bằng `toHaveText(String(quantity))`, tức là đúng hướng.
  Vì sao: người đọc (hay chính bạn ở D20) sẽ không biết file nào còn sống. `getCartQuantity()` kiểu "đọc text → parse → trả về số" là **thói quen Selenium** (`int(element.text)` rồi `assert ==`). Để nó nằm sẵn trong POM là mời người sau dùng nó thay vì web-first assertion.
  Hint: xoá hẳn, hoặc ghi rõ trong daily-log "để dành cho D?? (register qua API)". Keyword để tự tìm unused export: `ts-prune` / `knip`.

### Low

- **[Low] `src/pages/HomePage.ts:58-62`: `productCardByName` tự build regex `^\s*...\s*$` + `escapeRegExp` để match tên chính xác.**
  Vì sao: chạy đúng (đã phân biệt được "Pliers" và "Combination Pliers"), nhưng bạn đang tự viết lại thứ Playwright đã có sẵn. Thêm một file `utils/regex.ts` chỉ để phục vụ việc này. Dòng này cũng tạo lại `page.getByTestId("product-name")` dù đã có `this.productNames`.
  Hint: đọc option `exact` của `getByText` (match toàn bộ chuỗi, có trim whitespace) và kết hợp với `filter({ has: ... })`. Docs: https://playwright.dev/docs/api/class-page#page-get-by-text

- **[Low] `tests/ui/product.detail.spec.ts:19-26`: đọc `href` + `innerText` giá, rồi `.replace("$", "")` và `new RegExp(escapeRegExp(href))`.**
  Vì sao: lấy giá ở card để so với trang detail là hợp lý (giá trị cần mang qua trang khác thì phải đọc ra). Nhưng phần URL thì phức tạp hơn mức cần: `toHaveURL` nhận **string** và resolve theo `baseURL`, nên href tương đối kiểu `/product/<id>` có thể dùng trực tiếp. Việc bỏ `$` bằng tay cũng giòn nếu sau này format giá đổi (ví dụ `$1,234.00`).
  Hint: thử `toHaveURL(href)`. Với giá, cân nhắc so sánh bằng regex hoặc giữ nguyên chuỗi `$xx.xx` nếu hai trang cùng format. Docs: https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-url

- **[Low] `tests/ui/home.spec.ts:20,30,37`: hardcode `toHaveCount(9)`.**
  Vì sao: 9 là page size hiện tại của site. Site đổi page size, hoặc trang cuối có ít hơn 9 sản phẩm, là test fail dù chức năng vẫn đúng. Với test pagination, điều bạn thật sự muốn kiểm là "trang 2 khác trang 1", và assertion `not.toHaveText(firstProduct)` đã làm việc đó rồi.
  Hint: đưa 9 vào một hằng số có tên (`PAGE_SIZE`) trong data/config, hoặc chỉ assert `not.toHaveCount(0)` ở những chỗ không cần con số chính xác.

- **[Low] `tests/ui/home.spec.ts:21`: `for (const card of await homePage.productCards.all())`.**
  Vì sao: `.all()` **không auto-wait** và trả về snapshot các locator tại thời điểm gọi. Bạn đã đặt `toHaveCount(9)` ngay trước nên hiện tại an toàn, đây là cách dùng đúng theo docs. Chỉ lưu ý: nếu bỏ dòng `toHaveCount` thì vòng lặp có thể chạy trên list rỗng và **pass mà không kiểm gì**.
  Docs: https://playwright.dev/docs/api/class-locator#locator-all (đọc phần Note)

- **[Low] `src/data/login.data.ts:22,36`: `uniqueEmail()` vẫn gọi ở module scope** (Low từ day09, chưa đổi). Câu hỏi day09 trong daily-log cũng chưa được trả lời. Câu đó chính là giải thích vì sao đây là vấn đề.

- **[Low] Mất coverage khi gộp login:** case "Empty email and password" dùng `expect.soft` cho **cả 2** lỗi cùng lúc và assertion `not.toHaveURL("/account")` đã bị xoá. `loginCases` không có case tương đương, vì mỗi case chỉ có một `errorPosition`. Day09 đã gợi ý giữ lại những case có assertion khác biệt.
  Hint: hoặc giữ 1 test riêng cho case đó, hoặc cho `LoginCase` hỗ trợ nhiều lỗi (`expectedErrors: Partial<Record<ErrorPosition, string>>`).

- **[Low] `src/data/product.data.ts:1`: tên `productNames` (data) trùng với `homePage.productNames` (Locator).** Đọc `productNames.combinationPliers` trong test dễ nhầm là locator. Nên đổi tên kiểu `PRODUCTS` / `productCatalog`.

- **[Low] `docs/daily-log.md`: `###Day10` thiếu dấu cách**, nên Markdown không render thành heading. Thiếu heading ngày `## 2026-11-18` cho Day10 (cùng ngày với Day09, nên OK nếu cố ý). Câu day08 (c) vẫn chưa trả lời.

### Không phát hiện

- Không có `waitForTimeout`/sleep, không có `expect(await ...textContent())`, không có floating promise, không có `test.only`, không có `any`.
- `eslint-disable-next-line playwright/valid-test-tags` có ghi lý do rõ ràng, và type `` TestTag = `@${string}` `` thực sự đảm bảo điều đó lúc compile. Đây là cách disable rule đúng.

## Làm tốt

1. **Xử lý review có hệ thống**: 5/7 issue day09 đã sửa đúng hướng, không chỉ sửa bề mặt. Ví dụ, chuyển `ErrorPosition` về page để đảo chiều phụ thuộc, và đổi tag smoke sang `tags ?? ["@regression"]` để default an toàn. Thêm `scripts` giúp `npm run check` thành một lệnh duy nhất cho CI sau này.
2. **Locator scoped theo card**: `productNameIn(card)` / `productPriceIn(card)` trả về `Locator` con của một card, nên test kiểm được "name và price nằm **cùng** card", không phải hai list song song có thể lệch index. Đây là cách làm của Playwright thay cho kiểu Selenium `find_elements` 2 list rồi `zip`.
3. **Assertion so sánh trước/sau action đúng kiểu web-first** (`home.spec.ts:36-38`): đọc tên sản phẩm đầu **một lần** làm giá trị mốc, sau đó `await expect(firstProductName).not.toHaveText(firstProduct)`. Playwright tự retry tới khi trang 2 load xong. Không có `sleep` hay `waitForSelector` sau click "Next".

## Score

| Tiêu chí                     | Điểm                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| Correctness (3)              | 2.5: 15/15 xanh; trừ vì tag sai làm `test:smoke` chạy cả regression, và thiếu Filter so với roadmap |
| Locator & waiting (3)        | 2.5: locator scoped theo card tốt, không có wait thừa; trừ vì regex tự build thay `exact`, hardcode 9 |
| Structure/POM (2)            | 1.5: POM gọn, fixture mới đúng pattern; trừ vì getter đọc text kiểu Selenium còn sót và mất 1 case login |
| Readability & TS quality (2) | 1: dead code ở 3 file data + 2 member ProductPage, trùng tên `productNames`, describe name sai     |
| **Tổng**                     | **7.5 / 10**                                                                                        |

**Kết luận: PASS** ✅. Không có issue High, score ≥ 7. Issues: High 0 · Medium 3 · Low 8.
Nên sửa issue tag trước D11. Từ D11 bạn sẽ thêm setup project và `--grep` theo tag, nên tag sai thì CI chạy sai bộ test.

## Câu hỏi kiểm tra hiểu bài

Trong `home.spec.ts`, bạn đặt `{ tag: ["@smoke"] }` ở `test.describe` và `{ tag: ["@regression"] }` ở test "Pagination goes to next page".

(a) Test đó cuối cùng có những tag nào? Lệnh `npx playwright test --grep @smoke --grep-invert @regression` có chạy nó không? Đừng đoán, hãy chạy `--list` để kiểm chứng.
(b) `--grep` match theo cái gì: chỉ tag, hay **toàn bộ title** (gồm cả tên describe và tag)? Vậy nếu một test tên là `"Search for @smoke-like items"` thì sao?
(c) So với pytest: `pytestmark = pytest.mark.smoke` ở module cộng với `@pytest.mark.regression` ở function thì `-m "smoke and not regression"` cho kết quả gì? Hai cơ chế có giống nhau không?

Docs: https://playwright.dev/docs/test-annotations#tag-tests · https://playwright.dev/docs/test-cli
