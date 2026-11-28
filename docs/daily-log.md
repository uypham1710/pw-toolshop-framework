# Daily Log

## 2026-11-15

### Day01

**Học:**
Setup và làm quen với Playwright core
**Làm:**
Init project
Đọc hiểu file playwright config
Chạy test example + xem report, đọc log trace
Chạy thử UI mode
**Blocker:**
lỗi process không được nhận diện, rồi lỗi ESM/CJS với nodenext + verbatimModuleSyntax, cách đã fix bằng bundler.
exactOptionalPropertyTypes xung đột với workers: undefined
**Câu hỏi reviewer**
Config hiện tại có `trace: 'on-first-retry'` và `retries: process.env.CI ? 2 : 0`. **Khi chạy local và một test fail, bạn có trace để mở bằng Trace Viewer không? Vì sao?** Nếu không, có những cách nào để có trace khi debug local _mà không sửa vĩnh viễn_ config? (Gợi ý: CLI flag của `npx playwright test`.)
trả lời: Khi chạy local và một test fail, không mở trace viewer. vì local khong có retry, trace chỉ có ở lần retry đầu tiên
dùng command: npx playwright test --trace on

## 2026-11-16

### Day02

**Học:**
Typescript basics
**Làm:**
interface, import và export
! định nghĩa biến đó chắc chắn ko phải undefined
dùng filter để lọc thêm điều kiện locator
Chuyển "type" sang "module" để package.json khớp với tsconfig (module: esnext + verbatimModuleSyntax): code viết bằng ESM nên Node cũng phải hiểu là ESM. Trong ESM không có __dirname, thay bằng import.meta.dirname.
**Blocker:**
khi dùng getByRole hiểu nhầm name và class giống bên Selenium
**Câu hỏi reviewer**
Nếu ở `home.smoke.spec.ts:6` bạn **quên `await`** trước `expect(page).toHaveTitle(/Practice Software Testing/)` và site đổi title sang chuỗi khác:
(a) test sẽ pass hay fail, và vì sao (gợi ý: `toHaveTitle` trả về gì, test function kết thúc khi nào)?
test fail và không báo lỗi rõ ràng về title sai, mà là Test Ended
Không có await thì test function chạy tới cuối và kết thúc ngay, assertion bị cắt ngang nên Playwright báo Test ended chứ không báo title sai.”
(b) Trong repo này, công cụ nào sẽ bắt lỗi đó _trước khi_ chạy test, và rule tên gì?
công cụ eslint, rule: @typescript-eslint/no-floating-promises

### Day03

**Học:**
Locator
**Làm:**
Role: ưu tiên dùng, dùng cho các element có thể tương tác được (button, link, checkbox, ...)
Label: thường dùng cho các field trong form có label
test id: dùng khi không thể get by role,text,...
**Blocker:**
Flaky test khi search product
solution: chờ cho product xuất hiện trong grid mới bắt đầu search
**Câu hỏi reviewer**
Giả sử form login có thêm field label **"Confirm email address \*"**:
(a) `page.getByLabel("Email address")` (không `exact`) sẽ match mấy element? Khi gọi `.fill()` thì Playwright làm gì, và vì sao nó **không** tự lấy element đầu tiên như `driver.find_element` của Selenium? (keyword: _strict mode_)
match 2 element, khi gọi fill sẽ không action được mà quăng về lỗi strict mode
Nếu Playwright tự lấy element đầu tiên như Selenium, nó có thể fill nhầm sang ô “Confirm email” chỉ vì thứ tự trong DOM thay đổi. Test vẫn chạy tiếp, có khi còn pass, nghĩa là sai mà không ai biết.
(b) Viết lại locator đó sao cho vẫn **không** phụ thuộc dấu `*` mà chỉ match đúng field "Email address". Chỉ cần mô tả hướng làm (regex hay option nào), không cần code đầy đủ.
page.getByLabel(/^email address/i)

### Day04

**Học:**
Web-first assertions + soft assertion
**Làm:**
Viết test cho login success, fail
dùng assert để
**Blocker:**
CI bị Cloudflare chặn, local pass”. DoD của Day 4 chỉ yêu cầu npx playwright test pass ở local, nên việc này không chặn Day 4
**Câu hỏi reviewer**
Giả sử form login có thêm field label **"Confirm email address \*"**:
(a) `page.getByLabel("Email address")` (không `exact`) sẽ match mấy element? Khi gọi `.fill()` thì Playwright làm gì, và vì sao nó **không** tự lấy element đầu tiên như `driver.find_element` của Selenium? (keyword: _strict mode_)
match 2 element, khi gọi fill sẽ không action được mà quăng về lỗi strict mode
Nếu Playwright tự lấy element đầu tiên như Selenium, nó có thể fill nhầm sang ô “Confirm email” chỉ vì thứ tự trong DOM thay đổi. Test vẫn chạy tiếp, có khi còn pass, nghĩa là sai mà không ai biết.
(b) Viết lại locator đó sao cho vẫn **không** phụ thuộc dấu `*` mà chỉ match đúng field "Email address". Chỉ cần mô tả hướng làm (regex hay option nào), không cần code đầy đủ.
page.getByLabel(/^email address/i)

## 2026-11-17

### Day05

**Học:**
describe, hooks, tags, test.step for login/search
**Làm:**
thêm test.describe, test.step, tags smoke và regression
Khi chạy: npx playwright test --grep "@smoke" sẽ chỉ chạy 2 test cases có tag smoke
**Blocker:**
None
**Câu hỏi reviewer**
Giả sử để bỏ lặp locator, bạn viết trong `test.describe("Login tests")`:
khai báo `let email: Locator;` ở cấp describe, rồi trong `beforeEach(async ({ page }) => ...)` gán `email = page.getByLabel(...)`.

(a) Với `fullyParallel: true` và 6 workers, cách này có gây lỗi không? Gợi ý: mỗi worker là một **process riêng** hay một thread? File test được load bao nhiêu lần? Trong **cùng một worker**, các test chạy tuần tự hay song song?
không gây lỗi
Worker là một process riêng (Node.js child process), không phải thread. Các worker không dùng chung bộ nhớ.
Mỗi worker tự load lại file test. Biến let email ở cấp describe vì vậy tồn tại thành 6 bản riêng, mỗi worker giữ một bản, và không worker nào nhìn thấy bản của worker khác.
Trong cùng một worker, các test chạy tuần tự. Bạn trả lời đúng phần này. beforeEach gán lại email ngay trước mỗi test, nên không có hai test nào cùng đọc hay ghi biến đó một lúc.
(b) Nếu đổi `beforeEach` thành `beforeAll`, bạn có dùng được fixture `page` không? Vì sao Playwright thiết kế như vậy (keyword: test-scoped vs worker-scoped fixture)?
không dùng được page, vì page chỉ nằm trong test-scoped, còn before all là worker-scoped
(c) Vậy vì sao vẫn khuyên **không** dùng pattern này, và D6/D7 thay nó bằng gì?
Docs: https://playwright.dev/docs/test-parallel · https://playwright.dev/docs/test-fixtures
Pattern này chạy được, nhưng không nên dùng vì 4 lý do:

Correctness đang dựa vào một giả định ngầm. Nó chỉ đúng vì test trong cùng worker chạy tuần tự. Người đọc phải hiểu cơ chế worker mới biết code an toàn. Đây là shared mutable state, kiểu self.email = ... trong setUp của Python.
TS không bảo vệ được bạn. let email: Locator; khai báo nhưng chưa gán. Khi biến được dùng bên trong một closure khác, TS strict không báo lỗi “used before assigned”. Nếu beforeEach quên gán hoặc gán nhầm, test chỉ nổ lúc runtime với lỗi undefined.
Không tái sử dụng được giữa các file. File khác cũng cần locator email/password thì lại phải copy toàn bộ khối let + beforeEach.
Khó đọc. Đọc một test, bạn không biết email đến từ đâu nếu không cuộn lên tìm hook.Thay bằng gì:

D6, POM: class LoginPage với constructor(private readonly page: Page) và các Locator readonly. Locator được khai báo một lần, type an toàn, không bị gán lại.
D7, custom fixture test.extend: fixture inject loginPage thẳng vào test qua async ({ loginPage }) => .... Mỗi test nhận một instance riêng, không có biến module-level, không cần beforeEach để gán.

### Day06

**Học:**
POM, refactor test theo POM
**Làm:**
Tạo LoginPage và HomePage, refator lại locator và actions trong page
refactor test file, sử dụng POM
**Blocker:**
None
**Câu hỏi reviewer**
(a) Constructor có throw lỗi không?
Không. `page.getByLabel(...)` là hàm đồng bộ, trả về `Locator` chứ không phải `Promise`, nên không cần `await`.
Lúc tạo Locator, Playwright KHÔNG gửi lệnh nào tới browser. Vì vậy dù trang đang là `about:blank`, `new LoginPage(page)` vẫn chạy bình thường.

Selenium thì khác: `driver.find_element(...)` là một lệnh WebDriver, gửi HTTP request tới driver ngay lúc gọi.
Nếu gọi trong `__init__` khi trang chưa mở, nó sẽ ném `NoSuchElementException` ngay lập tức.
Kể cả khi tìm được, nó cũng chỉ trả về một element cố định tại thời điểm đó.
Vì thế Selenium phải dùng cách "lazy":

- Java: `PageFactory.initElements` + `@FindBy` tạo **proxy**. Mỗi lần gọi method trên field, proxy mới thật sự gọi `find_element`.
- Python: lưu tuple `(By.ID, "email")` trong page class, rồi mỗi action tự gọi `find_element(*locator)`.
  Playwright Locator có sẵn tính lazy đó, không cần PageFactory.

(b) Locator lưu cái gì, và khi nào mới tìm element?
Locator chỉ là một "recipe": tham chiếu tới `page`/frame + chuỗi selector (cộng các điều kiện chain như `filter`, `nth`).
Nó KHÔNG giữ element hay DOM node nào. `toString()` chỉ in ra mô tả selector.
Playwright chỉ resolve recipe thành element khi có action (`click`, `fill`...) hoặc assertion (`expect(...).toBeVisible()`...).
Mỗi lần resolve:

- Tìm lại element trong DOM hiện tại.
- Kiểm tra strict mode (match đúng 1 element với action).
- Auto-wait actionability checks (visible, stable, enabled, receives events...) tới khi đạt hoặc hết timeout.
- Với web-first assertion, Playwright resolve lại liên tục và retry cho tới khi pass hoặc timeout.

(c) Vì sao `readonly` Locator an toàn khi reload/re-render, còn WebElement bị stale?
`WebElement` giữ một element reference id trỏ tới MỘT DOM node cụ thể.
Khi trang reload hoặc Angular re-render form, node cũ bị gỡ khỏi DOM và node mới thay vào.
Reference cũ vẫn trỏ tới node đã bị gỡ, nên gọi tiếp sẽ nhận `StaleElementReferenceException`.
`Locator` không giữ node nào. Mỗi action/assertion đều resolve lại từ recipe trên DOM hiện tại, nên luôn lấy đúng node mới nhất.
Vì recipe không bao giờ "hết hạn", không cần gán lại. Đó là lý do khai báo `readonly` vừa an toàn vừa đúng ý nghĩa: định nghĩa một lần, dùng suốt vòng đời page object.
Playwright cũng có thứ tương đương WebElement là `ElementHandle`, nhưng docs khuyên không dùng (discouraged) vì nó trỏ tới một node cố định và có thể bị detached giống stale element. Nên dùng Locator thay thế.
Docs: https://playwright.dev/docs/locators · https://playwright.dev/docs/api/class-elementhandle

### Day07

**Học:**
add page fixtures, refactor tests
**Làm:**
Tạo page fixture cho loginPage và homePage
import và re-export test và expect
refactor lại file test dùng fixture
xóa file locators.spec.ts vì trước đó chỉ dùng để demo
**Blocker:**
None
**Câu hỏi reviewer**
Trong test "Invalid password", bạn request cả `{ loginPage, page }`.

(a) `page` mà test nhận và `page` bên trong `loginPage` (được truyền vào ở `pages.fixture.ts:13`) là **cùng một object** hay hai tab khác nhau? Vì sao? (keyword: fixture được cache trong phạm vi một test, test-scoped)
cùng 1 object
Vì sao: fixture là test-scoped và được cache trong phạm vi một test. Khi chạy một test, Playwright dựng cây phụ thuộc:

test cần { loginPage, page }
└─ loginPage cần { page }

page chỉ được tạo một lần, rồi cùng instance đó được đưa cho cả loginPage (qua ({ page }, use)) lẫn test. 🐍 Hành vi này giống pytest fixture scope="function": trong một test, mọi chỗ xin page đều nhận cùng một object. Sang test kế tiếp thì page mới được tạo lại.
(b) Ở `search.spec.ts`, test chỉ request `homePage`. Fixture `loginPage` có bị khởi tạo không? So sánh với `@pytest.fixture(autouse=True)`: Playwright fixture mặc định là lazy hay eager, và option nào làm nó giống `autouse`?
Fixture `loginPage` không bị khởi tạo
Vì sao: Playwright fixture mặc định là lazy. Fixture chỉ được setup khi test, hook (beforeEach...) hoặc một fixture khác xin nó theo tên.
Đó là option { auto: true }. Khi khai báo fixture dưới dạng tuple [hàmFixture, { auto: true }], fixture sẽ eager: tự chạy cho mọi test dù test không xin. Ứng dụng thường gặp là tự động log hoặc tự đính kèm thông tin debug cho mọi test.
(c) Nếu sau này `homePage` fixture cần teardown (ví dụ xoá giỏ hàng sau test), code teardown đặt ở đâu so với `await use(homePage)`, và nó có chạy khi test fail không?
đặt bên dưới `await use(homePage)`
có chạy khi fail
Vì sao chạy được khi fail: use() chỉ resolve khi test kết thúc, dù test pass, fail hay timeout. Sau đó Playwright luôn tiếp tục chạy phần code còn lại của fixture. 🐍 Cơ chế này giống hệt code sau yield trong pytest fixture.
Docs: https://playwright.dev/docs/test-fixtures

### Day08

**Học:**
config dotenv, baseurl, confidential
**Làm:**
config thêm file env.ts
update lại test file sử dụng theo config mới
khi thiếu biến trong .env thì show lỗi rõ ràng:
Error: Missing required environment variable "BASE_URL". Copy .env.example to .env and fill in the value.
**Blocker:**
None
**Câu hỏi reviewer**
(a) Khi chạy 6 workers, `env.ts` (và `dotenv/config`) được evaluate **bao nhiêu lần**, và vì sao? So với Python: một module-level `settings = Settings()` được import trong 6 process `pytest-xdist` thì sao? Gợi ý: nhìn số dòng `◇ injected env` trong output.
7 lần
(b) `AppConfig` khai báo `readonly baseUrl`. Nếu ở đâu đó viết `(config as any).baseUrl = "x"`, thì runtime có chặn không? `readonly` của TS bảo vệ ở **compile-time** hay **runtime**? Muốn chặn ở runtime thì dùng gì? (keyword: `Object.freeze`, `as const`)
tôi nghĩ là bảo vệ ở complile-time,
(c) Với `baseURL` hiện tại, `page.goto("/auth/login")` và `page.goto("auth/login")` khác nhau thế nào nếu sau này `BASE_URL` có path, ví dụ `https://example.com/toolshop/`? (keyword: URL resolution, `new URL(relative, base)`)

## 2026-11-18

### Day09

**Học:**
Test data: factory/builder và data-driven test
**Làm:**
Đưa test data vào data/
Viết user factory để sinh data hợp lệ
Data-driven test cho login nevagtive và search
vì sao filter + toHaveCount(0) ổn định hơn allTextContents() + loop?
Web-first assertion retry trên Locator nên tự chờ trang cập nhật (ổn định); allTextContents() chụp một lần nên phụ thuộc timing (flaky). Nhưng retry có thể pass sớm trên trạng thái cũ/rỗng, nên cần assert một “anchor” (caption) trước để đảm bảo đang kiểm tra đúng kết quả.
hasNotText không phân biệt hoa thường
**Blocker:**
None
**Câu hỏi reviewer**
Giả sử bạn đổi title thành `` `login fail: ${loginCase.title} (${loginCase.email})` ``. Case "Invalid email or password" dùng `uniqueEmail()` ở module scope.

(a) Chạy `npx playwright test --list` rồi chạy thật với 6 workers thì chuyện gì xảy ra, và **vì sao**? (Gợi ý: main process collect test theo title, sau đó worker **import lại** file spec.)
(b) Từ đó rút ra quy tắc: giá trị random nên được sinh ở đâu (module scope, trong `test()`, hay trong fixture)?
(c) So với Python: `pytest-xdist` báo lỗi gì khi `parametrize` sinh id khác nhau giữa các worker?

### Day10
**Học:**
refactor POM + add search/product tests
**Làm:**
Fix các review medium/low trước đó
Thêm các test mới
Rà lại test ko còn import test và expect từ playwright
**Blocker:**
None

### Day11

## 2026-11-24

**Học:**
storageState + setup project
**Làm:**
tạo file auth.setup, config trong playwright.congfig, file auth.setup sẽ chạy đầu tiên mỗi lần chạy test, login và save storageState vào 1 file.
Đã chuyển project từ ESM về CJS.
Lý do: để khớp với docs Playwright, vốn dùng __dirname.
Đã kiểm tra tsc, eslint, test sau khi đổi, đều pass.
**Blocker:**
None

## Câu hỏi kiểm tra hiểu bài

Toolshop lưu token login ở đâu (cookie hay `localStorage`)? Từ đó giải thích: vì sao `storageState` vẫn dùng được, và nếu bạn có 4 workers cùng chạy test **thay đổi giỏ hàng** với cùng `user.json`, chuyện gì có thể xảy ra — bạn sẽ đổi setup thế nào để mỗi worker có account riêng?
token lưu ở localStorage

### Day12

## 2026-11-26

**Học:**
request fixture / APIRequestContext với Toolshop API
**Làm:**
Thêm project API mới trong playwright config
Thêm test case api
Làm quen với request fixture
**Blocker:**
None

### Day13

## 2026-11-27
**Học:**
API client layer có types
**Làm:**
Thêm types cho api
tạo client
thêm helper http
tạo api fixture
sửa lại test dùng client
**Blocker:**
None