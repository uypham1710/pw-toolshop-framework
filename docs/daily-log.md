# Daily Log

## 2026-11-15

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