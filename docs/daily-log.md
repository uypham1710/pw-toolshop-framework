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
