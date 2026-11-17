# Review day06 — 2026-11-17

**Mục tiêu D6 (roadmap):** POM bằng class TS: `constructor(private readonly page: Page)`, `readonly` Locator; không BasePage nặng.
**Phạm vi:** commit `83e5fe3` (`src/pages/HomePage.ts`, `src/pages/LoginPage.ts`, refactor `login.spec.ts` + `search.spec.ts`, daily-log).

## Kiểm tra tự động

| Lệnh                                  | Kết quả                                     |
| ------------------------------------- | ------------------------------------------- |
| `npx tsc --noEmit`                    | ✅ 0 lỗi                                    |
| `npx eslint .`                        | ✅ 0 lỗi                                    |
| `npx playwright test --reporter=list` | ✅ 12/12 passed, 6 workers, 6.6s (chromium) |

Mục tiêu D6 đạt: 2 page object, locator `readonly`, action method `async`, không có BasePage, không có assertion trong page object. Issue Medium ở search.spec của day05 đã được xử lý.

## Issues

**[Medium] src/pages/LoginPage.ts:19-21 — `goto()` của `LoginPage` mở `"/"` (trang chủ), không phải `/auth/login`**
— Vì sao: method này tên là "đi tới trang Login" nhưng thực tế mở Home. Hiện chưa test nào gọi nó (login.spec vẫn dùng `page.goto("/auth/login")` trong `beforeEach`) nên suite vẫn xanh. Nhưng đây là **latent bug**: ngày nào bạn (hoặc fixture ở D7) gọi `loginPage.goto()` rồi `login(...)`, `fill` sẽ chờ label "Email address" tới hết timeout rồi fail, và error message sẽ khiến bạn đi tìm lỗi ở locator thay vì ở URL. Code chưa dùng mà sai còn nguy hiểm hơn không có code.
— Hint: sửa URL cho đúng, rồi **dùng nó**: thay `page.goto("/auth/login")` trong `login.spec.ts:7` bằng method của page object. Khi đó kiến thức "trang login nằm ở URL nào" chỉ tồn tại ở một chỗ. `HomePage` cũng nên có `goto()` tương tự cho `search.spec.ts:6`.

**[Low] src/pages/LoginPage.ts:4,11 + HomePage.ts:4,12 — chưa dùng parameter property `private readonly page` như mục tiêu D6**
— Vì sao: cách bạn viết (`readonly page: Page;` + `this.page = page`) **không sai**, docs Playwright cũng có ví dụ y như vậy. Nhưng nó dài hơn, và `page` đang là **public**, nên test có thể gọi `loginPage.page.xxx` và làm rò abstraction. Đây là thói quen Python `def __init__(self, page): self.page = page`. TS có cú pháp ngắn hơn và đóng gói chặt hơn.
— Hint: tra keyword "TypeScript parameter properties". Một modifier (`private readonly`) đặt trên tham số constructor vừa khai báo field vừa gán giá trị. So sánh với Python: gần giống `@dataclass` tự sinh `__init__`. Sau đó thử khai báo locator dạng field initializer ngay tại chỗ khai báo thay vì gán trong constructor, rồi xem `tsc` có đồng ý không.

**[Low] tests/ui/login.spec.ts:14, 20 — test vẫn tự tạo locator `login-error`, `page-title` bằng `page.getByTestId`**
— Vì sao: `LoginPage` đã có `emailError`/`passwordError` nhưng lại thiếu `loginError`, nên POM không nhất quán: một nửa locator của trang Login nằm trong class, nửa còn lại nằm trong test. Còn `page-title` sau khi login thuộc **trang Account**, không thuộc Login.
— Hint: thêm `loginError` vào `LoginPage`. Với `page-title`, có 2 lựa chọn: tạo `AccountPage` nhỏ (chỉ 1 locator cũng được), hoặc chấp nhận để trong test tới khi có thêm test cho trang Account. Quy tắc: **locator nằm ở page object của trang chứa nó**.

**[Low] src/pages/LoginPage.ts:5 vs 6 — naming chưa nhất quán: `emailTextBox` / `passwordTextbox`**
— Vì sao: chữ `B` hoa/thường lệch nhau. Autocomplete sẽ làm người dùng gõ nhầm. `HomePage.productName` là locator trả về **nhiều** phần tử nhưng tên ở số ít. `searchCompletedText` thực ra là container chứa cả kết quả (bạn đang dùng nó làm scope cho `searchResults`), không chỉ là text.
— Hint: chọn một convention và giữ nó. Phổ biến là đặt tên theo vai trò: `emailInput`, `passwordInput`, `loginButton`, `productNames`, `searchResultsContainer`.

**[Low] tests/ui/search.spec.ts:19 — `results.first().toBeVisible()` thừa**
— Vì sao: dòng 20 `not.toHaveCount(0)` đã chứng minh có kết quả. Dòng 19 không thêm thông tin gì, còn thêm một `.first()` mà checklist khuyên tránh khi không cần.
— Hint: giữ một trong hai. Nếu muốn chắc là kết quả *hiển thị* chứ không chỉ có trong DOM, giữ `toBeVisible` và bỏ dòng kia. Đừng giữ cả hai.

**[Low] tests/ui/search.spec.ts:28-29, 35-42 — "No result search" chưa assert danh sách sản phẩm rỗng; precondition nằm ngoài step**
— Vì sao: test chỉ kiểm tra thông báo "There are no products found." Nếu app vừa hiện thông báo vừa vẫn render list cũ (bug thật hay gặp với SPA), test vẫn pass. Bạn đã có sẵn `homePage.searchResults` để assert điều này.
— Hint: thêm assertion số lượng kết quả bằng 0 vào step "Verify". Precondition ở dòng 29 có thể bỏ, vì `searchKeyword` → `fill` đã tự auto-wait textbox.

**[Low] Carry-over từ day05 (không lặp chi tiết)**
- `login.spec.ts:26`: "Invalid email" vẫn chưa có tag.
- `login.spec.ts:23`: `not.toHaveURL("/account")` vẫn pass ngay lần check đầu.
- `tests/ui/locators.spec.ts`: file bài tập D3 vẫn còn, test "Search for a product" trùng tên với `search.spec.ts`. Thêm nữa, `locators.spec.ts` và `home.smoke.spec.ts` chưa dùng POM, trong khi hôm nay là lúc tốt để chuyển chúng sang `HomePage`/`LoginPage`.
- `package.json`: `scripts` vẫn rỗng.
- `docs/daily-log.md`: mục "Câu hỏi reviewer" của day06 để trống.

## Làm tốt

1. **Scope `searchResults` vào container `search_completed`** (`HomePage.ts:15-17`). Đây là cách giải issue Medium day05 đúng tư duy Playwright: thay vì "chờ" kiểu Selenium (`WebDriverWait` cho tới khi list đổi), bạn **định nghĩa locator chỉ match khi search đã xong**. Kết hợp với `not.toHaveCount(0)` trước `filter(...).toHaveCount(0)`, assertion giờ không còn pass suông, và keyword `hammer` không match sản phẩm đầu trang chủ. Cả 3 hint đã được áp dụng.
2. **Page object "mỏng", đúng kiểu Playwright**: không có BasePage, không có `waitFor...`, không có assertion bên trong class. Method `searchKeyword`/`login` chỉ làm action rồi trả `Promise<void>` (khai báo return type tường minh). Tất cả `expect` vẫn nằm trong test. Đây là khác biệt lớn nhất so với POM Selenium hay gặp (`login_and_verify()`, `wait_for_page_loaded()` trong page class).
3. **`fill("")` carry-over được giải quyết tự nhiên**: giờ nó là tham số `login("", "")`, và ở dạng này giá trị rỗng **là dữ liệu test có chủ đích**, không còn là dòng code thừa.

## Score

| Tiêu chí                     | Điểm                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| Correctness (3)              | 2.5: suite xanh, search assertion đã chặt; trừ 0.5 vì `LoginPage.goto()` sai URL (latent)    |
| Locator & waiting (3)        | 3: locator ưu tiên role/label/testid, scoped locator thay cho wait; chỉ còn 1 `.first()` thừa |
| Structure/POM (2)            | 1.5: POM mỏng và đúng hướng; trừ vì navigation + một số locator vẫn nằm trong test            |
| Readability & TS quality (2) | 1.5: chưa dùng parameter property, naming lệch, các carry-over Low                            |
| **Tổng**                     | **8.5 / 10**                                                                                 |

**Kết luận: PASS** ✅. Score ≥ 7, không có issue High. Issues: High 0 · Medium 1 · Low 6.
Sửa issue Medium (`goto`) trước D7, vì fixture `test.extend` sẽ rất hay gọi `goto()` của page object.

## Câu hỏi kiểm tra hiểu bài

Trong `LoginPage` constructor, bạn tạo `page.getByLabel(/email address/i)` **ngay khi `new LoginPage(page)`**. Ở `login.spec.ts`, lúc đó trang Login đã được mở bởi `beforeEach`. Nhưng giả sử bạn tạo `new LoginPage(page)` **trước** khi `page.goto(...)`, tức là trang vẫn là `about:blank`.

(a) Constructor có throw lỗi không? So sánh với Selenium: `driver.find_element(...)` trong `__init__` của page class sẽ ra sao, và vì sao Selenium cần `PageFactory`/lazy proxy để làm được điều tương tự?
(b) Một `Locator` thực chất lưu cái gì, và thời điểm nào Playwright mới thật sự đi tìm element trong DOM?
(c) Hệ quả: vì sao locator ở dạng `readonly` property là an toàn ngay cả khi trang reload hay Angular re-render lại form, trong khi `WebElement` của Selenium sẽ bị `StaleElementReferenceException`?
Docs: https://playwright.dev/docs/locators · https://playwright.dev/docs/pom
